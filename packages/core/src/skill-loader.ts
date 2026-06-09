import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * The skill system: a "skill" is a folder with a `SKILL.md` — YAML frontmatter
 * (name, description, capabilities) plus a markdown runbook the agent follows.
 * The agent executes the runbook with its normal tools (run_command, read_file,
 * …); skills carry no privileged code of their own. The loader indexes skills
 * by name + description (injected into the system prompt) and serves the full
 * runbook on demand via the `load_skill` tool.
 */

export interface SkillMeta {
  name: string;
  description: string;
  capabilities: string[];
  /** Absolute directory that contains this skill's SKILL.md (+ any scripts). */
  dir: string;
}

export interface LoadedSkill extends SkillMeta {
  /** The runbook body, with `{{SKILL_DIR}}` substituted to the skill's dir. */
  body: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = FRONTMATTER_RE.exec(raw);
  if (!match) return { meta: {}, body: raw };
  const block = match[1] ?? "";
  const body = raw.slice(match[0].length);
  const meta: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (key) meta[key] = line.slice(idx + 1).trim();
  }
  return { meta, body };
}

/** Parse a `[a, b, c]` or bare `a, b` frontmatter list into trimmed strings. */
function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

/**
 * Loads and indexes skills from one or more search directories. Each search dir
 * holds `<skill-name>/SKILL.md`. On a name clash, later search dirs win (so a
 * user-installed skill can override a built-in one).
 */
export class SkillRegistry {
  private readonly skills = new Map<string, SkillMeta>();

  /**
   * @param opts.excludeCapabilities Skip skills that declare any of these
   *   capabilities (e.g. `["onchain_writes"]` to keep a surface read-only).
   */
  async load(
    searchDirs: string[],
    opts: { excludeCapabilities?: string[] } = {},
  ): Promise<void> {
    const deny = new Set(opts.excludeCapabilities ?? []);
    for (const base of searchDirs) {
      let entries;
      try {
        entries = await fs.readdir(base, { withFileTypes: true });
      } catch {
        continue; // search dir doesn't exist — skip
      }
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const dir = path.join(base, entry.name);
        let raw: string;
        try {
          raw = await fs.readFile(path.join(dir, "SKILL.md"), "utf8");
        } catch {
          continue; // no SKILL.md here
        }
        const { meta } = parseFrontmatter(raw);
        const name = (meta.name || entry.name).trim();
        const description = (meta.description ?? "").trim();
        if (!description) continue; // a skill needs a description to be useful
        const capabilities = parseList(meta.capabilities);
        if (deny.size && capabilities.some((c) => deny.has(c))) continue;
        this.skills.set(name, { name, description, capabilities, dir });
      }
    }
  }

  get size(): number {
    return this.skills.size;
  }

  list(): SkillMeta[] {
    return [...this.skills.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  /** Read a skill's full runbook, with `{{SKILL_DIR}}` resolved to its dir. */
  async read(name: string): Promise<LoadedSkill | null> {
    const meta = this.skills.get(name);
    if (!meta) return null;
    const raw = await fs.readFile(path.join(meta.dir, "SKILL.md"), "utf8");
    const { body } = parseFrontmatter(raw);
    return { ...meta, body: body.split("{{SKILL_DIR}}").join(meta.dir) };
  }

  /** Compact `name: description` listing injected into the system prompt. */
  indexForPrompt(): string {
    const items = this.list();
    if (!items.length) return "";
    return [
      "You have access to these SKILLS — reusable runbooks for specific tasks.",
      "When the user's request clearly matches one, call the `load_skill` tool with its name to get the full instructions, then follow them step by step. If nothing matches, just work normally.",
      "",
      "Available skills:",
      ...items.map((s) => `- ${s.name}: ${s.description}`),
    ].join("\n");
  }
}
