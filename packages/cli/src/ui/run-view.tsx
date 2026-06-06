import React, { useEffect, useRef, useState } from "react";
import { Box, Text, useApp } from "ink";
import Spinner from "ink-spinner";
import { AgentRunner, type AgentStep } from "@stackai/core";
import { applyStep, type Entry } from "./format.js";
import { EntryLines } from "./entry-lines.js";

interface RunViewProps {
  runner: AgentRunner;
  prompt: string;
  cwd: string;
}

/** One-shot run: streams a single agent response, then exits. */
export function RunView({ runner, prompt, cwd }: RunViewProps) {
  const { exit } = useApp();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Throttle streamed tokens so we re-render ~16x/sec instead of per-token
    // (per-token re-renders of a growing list can flood the terminal/crash it).
    let buffer = "";
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      timer = null;
      if (!buffer || cancelled) return;
      const text = buffer;
      buffer = "";
      setEntries((prev) => applyStep(prev, { type: "token", text }));
    };

    const onStep = (step: AgentStep) => {
      if (cancelled) return;
      if (step.type === "token") {
        buffer += step.text;
        if (!timer) timer = setTimeout(flush, 60);
      } else {
        flush();
        setEntries((prev) => applyStep(prev, step));
      }
    };

    runner
      .run({ prompt, cwd, onStep })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) {
          flush();
          setRunning(false);
          setTimeout(() => exit(), 50);
        }
      });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [runner, prompt, cwd, exit]);

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box>
        <Text color="#e8ff47" bold>
          StackAI{" "}
        </Text>
        {running ? (
          <Text color="gray">
            <Spinner type="dots" /> working…
          </Text>
        ) : (
          <Text color="gray">done</Text>
        )}
      </Box>

      <EntryLines entries={entries} />

      {error && (
        <Box marginTop={1} marginLeft={2}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}
    </Box>
  );
}
