import { promises as fs } from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { EditError, PathEscapeError } from "./errors.js";

const execAsync = promisify(exec);

/** Result of running a shell command. */
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** Directories never walked by grep/glob. */
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  ".turbo",
  "build",
  "out",
  "coverage",
  ".cache",
]);

/** Convert a simple glob (supports **, *, ?) into an anchored RegExp. */
function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
        if (glob[i + 1] === "/") i++;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else if (".+^${}()|[]\\".includes(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

/**
 * File tools the agent can call. Every path is resolved relative to — and
 * sandboxed within — a single working directory so the model can never read
 * or write outside the project it was pointed at.
 */
export class FileAgent {
  private readonly root: string;

  constructor(cwd: string) {
    this.root = path.resolve(cwd);
  }

  /** Resolve a user/model-supplied path and guarantee it stays inside root. */
  private resolve(relPath: string): string {
    const abs = path.resolve(this.root, relPath);
    const rel = path.relative(this.root, abs);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new PathEscapeError(relPath);
    }
    return abs;
  }

  async readFile(relPath: string): Promise<string> {
    return fs.readFile(this.resolve(relPath), "utf8");
  }

  async writeFile(relPath: string, content: string): Promise<void> {
    const abs = this.resolve(relPath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
  }

  /**
   * Replace the first occurrence of `oldStr` with `newStr`. Throws if the
   * string is missing or appears more than once (ambiguous edit).
   */
  async editFile(
    relPath: string,
    oldStr: string,
    newStr: string,
  ): Promise<void> {
    const abs = this.resolve(relPath);
    const current = await fs.readFile(abs, "utf8");
    const first = current.indexOf(oldStr);
    if (first === -1) {
      throw new EditError(`oldStr not found in ${relPath}`);
    }
    if (current.indexOf(oldStr, first + oldStr.length) !== -1) {
      throw new EditError(
        `oldStr is ambiguous in ${relPath} (appears multiple times)`,
      );
    }
    await fs.writeFile(abs, current.replace(oldStr, newStr), "utf8");
  }

  /** List entries in a directory, marking sub-directories with a trailing slash. */
  async listFiles(relDir = "."): Promise<string[]> {
    const abs = this.resolve(relDir);
    const entries = await fs.readdir(abs, { withFileTypes: true });
    return entries
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
      .sort((a, b) => a.localeCompare(b));
  }

  async createDir(relPath: string): Promise<void> {
    await fs.mkdir(this.resolve(relPath), { recursive: true });
  }

  /** Recursively yield every file path under `dir`, skipping ignored dirs. */
  private async *walkFiles(dir: string): AsyncGenerator<string> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name)) continue;
        yield* this.walkFiles(path.join(dir, e.name));
      } else {
        yield path.join(dir, e.name);
      }
    }
  }

  private rel(abs: string): string {
    return path.relative(this.root, abs).split(path.sep).join("/");
  }

  /** Search file contents (regex). Returns `path:line: text` matches. */
  async grep(pattern: string, maxResults = 80): Promise<string[]> {
    let re: RegExp;
    try {
      re = new RegExp(pattern);
    } catch {
      re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    }
    const out: string[] = [];
    for await (const abs of this.walkFiles(this.root)) {
      if (out.length >= maxResults) break;
      let content: string;
      try {
        content = await fs.readFile(abs, "utf8");
      } catch {
        continue; // binary / unreadable
      }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i]!)) {
          out.push(`${this.rel(abs)}:${i + 1}: ${lines[i]!.trim().slice(0, 160)}`);
          if (out.length >= maxResults) break;
        }
      }
    }
    return out;
  }

  /**
   * Run a shell command in the project root. Resolves with stdout/stderr and
   * the exit code even when the command fails (a non-zero exit is a result the
   * model should read, not a thrown error). Output is bounded by maxBuffer and
   * the command is killed after `timeoutMs`.
   */
  async runCommand(command: string, timeoutMs = 120_000): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.root,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      });
      return { stdout, stderr, exitCode: 0 };
    } catch (err) {
      const e = err as {
        code?: number;
        stdout?: string;
        stderr?: string;
        killed?: boolean;
        message?: string;
      };
      const stderr = e.killed
        ? `Command timed out after ${timeoutMs}ms`
        : (e.stderr ?? e.message ?? "");
      return {
        stdout: e.stdout ?? "",
        stderr,
        exitCode: typeof e.code === "number" ? e.code : 1,
      };
    }
  }

  /** Find files whose relative path matches a glob pattern. */
  async glob(pattern: string, maxResults = 200): Promise<string[]> {
    const re = globToRegExp(pattern);
    const out: string[] = [];
    for await (const abs of this.walkFiles(this.root)) {
      const rel = this.rel(abs);
      if (re.test(rel)) {
        out.push(rel);
        if (out.length >= maxResults) break;
      }
    }
    return out.sort((a, b) => a.localeCompare(b));
  }
}
