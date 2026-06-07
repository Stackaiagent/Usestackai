import React, { useCallback, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { ConfirmRun } from "@stackai/core";

const ACCENT = "#e8ff47";

interface Pending {
  command: string;
  resolve: (ok: boolean) => void;
}

/**
 * Interactive approval gate for `run_command`. Returns a `confirm` callback to
 * hand to the agent and an `element` to render the y/a/n prompt. Picking
 * "always" auto-approves the rest of this session.
 */
export function useCommandConfirm(): {
  confirm: ConfirmRun;
  element: React.ReactNode;
} {
  const [pending, setPending] = useState<Pending | null>(null);
  const autoApprove = useRef(false);

  const confirm = useCallback<ConfirmRun>((command) => {
    if (autoApprove.current) return true;
    return new Promise<boolean>((resolve) => {
      setPending({ command, resolve });
    });
  }, []);

  useInput(
    (input, key) => {
      if (!pending) return;
      const k = input.toLowerCase();
      if (k === "y" || key.return) {
        pending.resolve(true);
        setPending(null);
      } else if (k === "a") {
        autoApprove.current = true;
        pending.resolve(true);
        setPending(null);
      } else if (k === "n" || key.escape) {
        pending.resolve(false);
        setPending(null);
      }
    },
    { isActive: pending !== null },
  );

  const element = pending ? (
    <Box
      flexDirection="column"
      marginTop={1}
      marginLeft={2}
      borderStyle="round"
      borderColor={ACCENT}
      paddingX={1}
    >
      <Text color={ACCENT} bold>
        Run this command?
      </Text>
      <Text>$ {pending.command}</Text>
      <Text color="gray">
        <Text color={ACCENT}>y</Text> yes ·{" "}
        <Text color={ACCENT}>a</Text> always (this session) ·{" "}
        <Text color={ACCENT}>n</Text> no
      </Text>
    </Box>
  ) : null;

  return { confirm, element };
}
