import type { AgentStep } from "@stackai/core";

const ACCENT = "#e8ff47";
const MAX_PREVIEW = 6;

/** One rendered line: a tool header (●), an indented sub/diff line, or prose. */
export type Entry =
  | { kind: "tool"; color: string; label: string }
  | { kind: "sub"; color: string; text: string }
  | { kind: "text"; text: string };

function splitLines(s: string): string[] {
  return s.replace(/\n+$/, "").split("\n");
}

function clip(s: string, n = 76): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

/** Build a capped, prefixed preview of some lines (e.g. + added, - removed). */
function preview(lines: string[], prefix: string, color: string): Entry[] {
  const out: Entry[] = lines
    .slice(0, MAX_PREVIEW)
    .map((l) => ({ kind: "sub", color, text: `${prefix} ${clip(l)}` }));
  if (lines.length > MAX_PREVIEW) {
    out.push({
      kind: "sub",
      color: "gray",
      text: `… ${lines.length - MAX_PREVIEW} more lines`,
    });
  }
  return out;
}

/** Turn a tool_call into a header + preview/diff entries. */
function toolEntries(step: Extract<AgentStep, { type: "tool_call" }>): Entry[] {
  const args = step.args;
  const path = String(args.path ?? args.dir ?? "");

  switch (step.name) {
    case "write_file": {
      const lines = splitLines(String(args.content ?? ""));
      return [
        { kind: "tool", color: ACCENT, label: `Write(${path})` },
        { kind: "sub", color: "green", text: `+${lines.length} lines` },
        ...preview(lines, "+", "green"),
      ];
    }
    case "edit_file": {
      const removed = splitLines(String(args.oldStr ?? ""));
      const added = splitLines(String(args.newStr ?? ""));
      return [
        { kind: "tool", color: ACCENT, label: `Edit(${path})` },
        {
          kind: "sub",
          color: "gray",
          text: `+${added.length} -${removed.length} lines`,
        },
        ...preview(removed, "-", "red"),
        ...preview(added, "+", "green"),
      ];
    }
    case "read_file":
      return [{ kind: "tool", color: ACCENT, label: `Read(${path})` }];
    case "list_files":
      return [{ kind: "tool", color: ACCENT, label: `List(${path || "."})` }];
    case "create_dir":
      return [{ kind: "tool", color: ACCENT, label: `Create(${path}/)` }];
    case "search_files":
      return [
        { kind: "tool", color: ACCENT, label: `Search(${String(args.pattern ?? "")})` },
      ];
    case "find_files":
      return [
        { kind: "tool", color: ACCENT, label: `Find(${String(args.pattern ?? "")})` },
      ];
    default:
      return [{ kind: "tool", color: ACCENT, label: step.name }];
  }
}

/** Fold an agent step into an entries list (pure). */
export function applyStep(entries: Entry[], step: AgentStep): Entry[] {
  if (step.type === "token") {
    const last = entries[entries.length - 1];
    if (last && last.kind === "text") {
      return [
        ...entries.slice(0, -1),
        { kind: "text", text: last.text + step.text },
      ];
    }
    return [...entries, { kind: "text", text: step.text }];
  }
  if (step.type === "tool_call") {
    return [...entries, ...toolEntries(step)];
  }
  if (step.type === "tool_result") {
    if (!step.ok) {
      return [
        ...entries,
        { kind: "sub", color: "red", text: `✗ ${step.detail}` },
      ];
    }
    if (step.name === "read_file") {
      const n = step.detail ? splitLines(step.detail).length : 0;
      return [...entries, { kind: "sub", color: "gray", text: `read ${n} lines` }];
    }
    if (step.name === "search_files" || step.name === "find_files") {
      const empty = /^\(no /.test(step.detail);
      const n = empty ? 0 : splitLines(step.detail).length;
      return [...entries, { kind: "sub", color: "gray", text: `${n} results` }];
    }
  }
  return entries;
}
