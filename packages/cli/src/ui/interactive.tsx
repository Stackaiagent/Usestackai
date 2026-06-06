import React, { useEffect, useRef, useState } from "react";
import { Box, Text, useApp } from "ink";
import Spinner from "ink-spinner";
import TextInput from "ink-text-input";
import { AgentSession, type AgentStep } from "@stackai/core";
import { applyStep, type Entry } from "./format.js";
import { EntryLines } from "./entry-lines.js";

interface InteractiveProps {
  session: AgentSession;
  cwd: string;
  version: string;
}

type Block =
  | { kind: "user"; text: string }
  | { kind: "agent"; entries: Entry[] };

const ACCENT = "#e8ff47";

// "STACKAI" rendered in a compact block font (symbols, not plain text).
const LOGO = [
  "█▀▀ ▀█▀ █▀█ █▀▀ █▄▀ █▀█ █",
  "▄▄█  █  █▀█ █▄▄ █▀▄ █▀█ █",
];

/**
 * Interactive REPL — like `claude`. Shows a welcome banner, keeps full
 * conversation context across prompts, and uses a bordered input box.
 */
export function Interactive({ session, cwd, version }: InteractiveProps) {
  const { exit } = useApp();
  const [history, setHistory] = useState<Block[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards setState/throttle callbacks once the component unmounts (Ctrl+C /exit).
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  async function onSubmit(value: string) {
    const text = value.trim();
    if (!text) return;
    if (text === "/exit" || text === "/quit") {
      exit();
      return;
    }
    if (busy) return;
    setInput("");
    setError(null);
    setBusy(true);

    setHistory((prev) => [
      ...prev,
      { kind: "user", text },
      { kind: "agent", entries: [] },
    ]);

    const applyToHistory = (step: AgentStep) => {
      if (!mounted.current) return;
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.kind !== "agent") return prev;
        return [
          ...prev.slice(0, -1),
          { kind: "agent", entries: applyStep(last.entries, step) },
        ];
      });
    };

    // Throttle streamed tokens (~16x/sec) so big outputs don't flood/crash
    // the terminal with per-token re-renders of a growing list.
    let buffer = "";
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      timer = null;
      if (!buffer) return;
      const text = buffer;
      buffer = "";
      applyToHistory({ type: "token", text });
    };

    const onStep = (step: AgentStep) => {
      if (step.type === "token") {
        buffer += step.text;
        if (!timer) timer = setTimeout(flush, 60);
      } else {
        flush();
        applyToHistory(step);
      }
    };

    try {
      await session.send(text, onStep);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (timer) clearTimeout(timer);
      flush();
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Welcome banner */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={ACCENT}
        paddingX={2}
        paddingY={1}
      >
        {LOGO.map((line, i) => (
          <Text key={i} color={ACCENT} bold>
            {line}
          </Text>
        ))}
        <Box marginTop={1}>
          <Text color="gray">
            v{version} · MiMo v2.5 Pro · 1M context
          </Text>
        </Box>
        <Text color="gray">{cwd}</Text>
      </Box>

      <Box marginTop={1} marginBottom={1}>
        <Text color="gray">
          Describe what you want to build · type{" "}
          <Text color={ACCENT}>/exit</Text> to quit
        </Text>
      </Box>

      {/* Conversation */}
      {history.map((block, i) =>
        block.kind === "user" ? (
          <Box key={i} marginTop={1}>
            <Text color={ACCENT} bold>
              ›{" "}
            </Text>
            <Text>{block.text}</Text>
          </Box>
        ) : (
          <EntryLines key={i} entries={block.entries} />
        ),
      )}

      {error && (
        <Box marginTop={1} marginLeft={2}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {/* Input box */}
      <Box
        marginTop={1}
        borderStyle="round"
        borderColor={busy ? "gray" : ACCENT}
        paddingX={1}
      >
        {busy ? (
          <Text color="gray">
            <Spinner type="dots" /> working…
          </Text>
        ) : (
          <>
            <Text color={ACCENT}>› </Text>
            <TextInput
              value={input}
              onChange={setInput}
              onSubmit={onSubmit}
              placeholder="message StackAI…"
            />
          </>
        )}
      </Box>
    </Box>
  );
}
