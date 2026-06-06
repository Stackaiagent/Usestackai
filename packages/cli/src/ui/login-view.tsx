import React, { useState } from "react";
import { Box, Text, useApp } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { writeConfig, DEFAULT_API_URL } from "../config.js";
import { ApiClient } from "../api.js";

type Phase = "input" | "checking" | "done" | "error";

/** Interactive `stackai login` — prompts for the API key (masked), verifies it,
 * and saves the config pointing at the default (Railway) API. */
export function LoginView() {
  const { exit } = useApp();
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [message, setMessage] = useState("");

  async function submit(raw: string) {
    const key = raw.trim();
    if (!key) return;
    setPhase("checking");
    try {
      // Verify FIRST, then persist — never save an unverified/bad key.
      const verify = await new ApiClient({
        apiKey: key,
        apiUrl: DEFAULT_API_URL,
      }).verify();
      await writeConfig({ apiKey: key, apiUrl: DEFAULT_API_URL });
      setMessage(`Logged in as @${verify.user.username} · ${verify.user.tier} tier`);
      setPhase("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
      setPhase("error");
    } finally {
      setTimeout(() => exit(), 60);
    }
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box>
        <Text color="#e8ff47" bold>
          StackAI{" "}
        </Text>
        <Text color="gray">login</Text>
      </Box>

      {phase === "input" && (
        <Box marginTop={1}>
          <Text>API key </Text>
          <Text color="#e8ff47">› </Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={submit}
            mask="*"
            placeholder="sk_live_..."
          />
        </Box>
      )}
      {phase === "checking" && (
        <Box marginTop={1}>
          <Text color="gray">
            <Spinner type="dots" /> verifying…
          </Text>
        </Box>
      )}
      {phase === "done" && (
        <Box marginTop={1}>
          <Text color="green">✓ {message}</Text>
        </Box>
      )}
      {phase === "error" && (
        <Box marginTop={1}>
          <Text color="red">✗ {message}</Text>
        </Box>
      )}
    </Box>
  );
}
