const DEFAULT_API_URL = "https://api.stackai.build";

export interface StreamHandlers {
  onToken: (token: string) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

/** Minimal SSE client for /agent/run using global fetch (Node 18+ in VSCode). */
export async function runAgent(
  apiKey: string,
  prompt: string,
  cwd: string,
  handlers: StreamHandlers,
  apiUrl: string = DEFAULT_API_URL,
): Promise<void> {
  const res = await fetch(`${apiUrl}/agent/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, cwd }),
  });

  if (!res.ok || !res.body) {
    handlers.onError(`Agent request failed (${res.status})`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const { event, data } = parseFrame(frame);
      if (event === "token") handlers.onToken(data);
      else if (event === "error") {
        handlers.onError(data);
        return;
      }
    }
  }
  handlers.onDone();
}

export async function verifyKey(
  apiKey: string,
  apiUrl: string = DEFAULT_API_URL,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/auth/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function parseFrame(frame: string): { event: string; data: string } {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  return { event, data: dataLines.join("\n") };
}

export { DEFAULT_API_URL };
