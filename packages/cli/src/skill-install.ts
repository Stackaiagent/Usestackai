import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Install a skill from a public GitHub repo into ~/.stackai/skills. Reads the
 * repo via the GitHub contents API; file bytes come from raw.githubusercontent
 * (not rate-limited). The target path must contain a SKILL.md.
 */

const USER_SKILLS_DIR = path.join(os.homedir(), ".stackai", "skills");
const GH_API = "https://api.github.com";
const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "stackai-cli",
};

interface GhEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
}

async function ghList(owner: string, repo: string, p: string): Promise<GhEntry[]> {
  const res = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${p}`, {
    headers: HEADERS,
  });
  if (res.status === 404) throw new Error(`Not found: ${owner}/${repo}/${p}`);
  if (res.status === 403) throw new Error("GitHub rate limit hit — try again later.");
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${owner}/${repo}/${p}`);
  const json = (await res.json()) as GhEntry[] | GhEntry;
  if (!Array.isArray(json)) throw new Error(`Not a directory: ${p}`);
  return json;
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { headers: { "User-Agent": "stackai-cli" } });
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

async function downloadDir(
  owner: string,
  repo: string,
  p: string,
  destDir: string,
): Promise<number> {
  let count = 0;
  for (const entry of await ghList(owner, repo, p)) {
    const dest = path.join(destDir, entry.name);
    if (entry.type === "dir") {
      count += await downloadDir(owner, repo, entry.path, dest);
    } else if (entry.download_url) {
      await downloadFile(entry.download_url, dest);
      count += 1;
    }
  }
  return count;
}

export interface InstalledSkill {
  name: string;
  files: number;
}

/** Parse "owner/repo", a github URL, or "owner/repo/sub/path" → owner, repo, path. */
function parseRepo(repoArg: string, subpath: string): {
  owner: string;
  repo: string;
  target: string;
} {
  const cleaned = repoArg
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/^\/|\/$/g, "");
  const parts = cleaned.split("/");
  if (parts.length < 2) {
    throw new Error(`Invalid repo "${repoArg}". Use owner/repo [path].`);
  }
  const owner = parts[0]!;
  const repo = parts[1]!;
  const rest = parts.slice(2);
  const target = [...rest, subpath]
    .filter(Boolean)
    .join("/")
    .replace(/^\/|\/$/g, "");
  return { owner, repo, target };
}

/** Install the skill at owner/repo[/path] (must contain SKILL.md). */
export async function installSkill(
  repoArg: string,
  subpath = "",
): Promise<InstalledSkill> {
  const { owner, repo, target } = parseRepo(repoArg, subpath);
  const entries = await ghList(owner, repo, target);
  if (!entries.some((e) => e.type === "file" && e.name === "SKILL.md")) {
    throw new Error(
      `No SKILL.md at "${target || "(repo root)"}". Point to a skill folder, e.g. ` +
        `stackai skill add BankrBot/skills bankr`,
    );
  }
  const name = (target ? target.split("/").pop()! : repo).toLowerCase();
  const dest = path.join(USER_SKILLS_DIR, name);
  await fs.rm(dest, { recursive: true, force: true }); // clean reinstall
  const files = await downloadDir(owner, repo, target, dest);
  return { name, files };
}

/** Remove an installed (user) skill by name. Returns false if it wasn't there. */
export async function removeSkill(name: string): Promise<boolean> {
  const dest = path.join(USER_SKILLS_DIR, name);
  try {
    await fs.access(dest);
  } catch {
    return false;
  }
  await fs.rm(dest, { recursive: true, force: true });
  return true;
}
