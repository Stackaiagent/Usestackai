import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Persistent agent memory — durable facts and preferences kept across sessions.
 * Two scopes, each a markdown bullet list:
 *   - user    → applies everywhere (personal preferences)
 *   - project → facts about the current codebase
 * The agent reads memory at session start and writes via the remember/forget
 * tools. Files are local (never sent to a server).
 */

export type MemoryScope = "user" | "project";

const MAX_ITEMS = 100;

export class MemoryStore {
  constructor(
    private readonly userFile: string,
    private readonly projectFile: string,
  ) {}

  private file(scope: MemoryScope): string {
    return scope === "user" ? this.userFile : this.projectFile;
  }

  private async read(file: string): Promise<string[]> {
    try {
      const raw = await fs.readFile(file, "utf8");
      return raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.startsWith("- "))
        .map((l) => l.slice(2).trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private async write(file: string, items: string[]): Promise<void> {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const body = items.length ? items.map((i) => `- ${i}`).join("\n") + "\n" : "";
    await fs.writeFile(file, `# StackAI memory\n\n${body}`, "utf8");
  }

  /** Append a fact (deduped, case-insensitive) to a scope. */
  async remember(fact: string, scope: MemoryScope = "project"): Promise<void> {
    const norm = fact.trim();
    if (!norm) return;
    const f = this.file(scope);
    const items = await this.read(f);
    if (items.some((i) => i.toLowerCase() === norm.toLowerCase())) return;
    items.push(norm);
    await this.write(f, items.slice(-MAX_ITEMS));
  }

  /** Remove memories containing `query` (case-insensitive) from both scopes. */
  async forget(query: string): Promise<number> {
    const q = query.trim().toLowerCase();
    if (!q) return 0;
    let removed = 0;
    for (const f of [this.userFile, this.projectFile]) {
      const items = await this.read(f);
      const kept = items.filter((i) => !i.toLowerCase().includes(q));
      removed += items.length - kept.length;
      if (kept.length !== items.length) await this.write(f, kept);
    }
    return removed;
  }

  async load(): Promise<{ user: string[]; project: string[] }> {
    return {
      user: await this.read(this.userFile),
      project: await this.read(this.projectFile),
    };
  }

  async clear(scope: MemoryScope | "all"): Promise<void> {
    const files =
      scope === "all" ? [this.userFile, this.projectFile] : [this.file(scope)];
    for (const f of files) await this.write(f, []);
  }

  /** System-prompt block: how to use memory + the current saved facts. */
  async contextBlock(): Promise<string> {
    const { user, project } = await this.load();
    const lines = [
      "MEMORY — facts and preferences saved across past sessions. Treat them as known and follow them.",
      'Call the `remember` tool when the user shares a durable preference/fact or says "remember ...". Use scope "user" for personal preferences that apply everywhere, "project" for facts about this codebase. Call `forget` when a saved fact is wrong or the user says "forget ...". Do NOT save ephemeral, one-off details.',
      "",
    ];
    if (user.length) lines.push("Saved (user):", ...user.map((i) => `- ${i}`), "");
    if (project.length)
      lines.push("Saved (project):", ...project.map((i) => `- ${i}`), "");
    if (!user.length && !project.length) lines.push("Saved: (nothing yet)");
    return lines.join("\n").trim();
  }
}
