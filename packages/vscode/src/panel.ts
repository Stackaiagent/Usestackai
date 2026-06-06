import * as vscode from "vscode";
import { runAgent } from "./api.js";

const SECRET_KEY = "stackai.apiKey";

/** Webview sidebar panel: chat input + streaming message history. */
export class StackAIPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = "stackai.panel";
  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly secrets: vscode.SecretStorage,
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.html = this.html();

    view.webview.onDidReceiveMessage(async (msg: { type: string; text?: string }) => {
      if (msg.type === "prompt" && msg.text) {
        await this.handlePrompt(msg.text);
      }
    });
  }

  /** Public entry used by the "Run on File" command. */
  async run(prompt: string): Promise<void> {
    if (this.view) {
      this.view.show?.(true);
    }
    await this.handlePrompt(prompt);
  }

  private post(message: unknown): void {
    void this.view?.webview.postMessage(message);
  }

  private async handlePrompt(prompt: string): Promise<void> {
    const apiKey = await this.secrets.get(SECRET_KEY);
    if (!apiKey) {
      void vscode.window.showWarningMessage(
        "StackAI: set your API key first (StackAI: Set API Key).",
      );
      this.post({ type: "error", text: "No API key set." });
      return;
    }

    const cwd =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();

    this.post({ type: "user", text: prompt });
    this.post({ type: "start" });

    await runAgent(apiKey, prompt, cwd, {
      onToken: (token) => this.post({ type: "token", text: token }),
      onError: (text) => this.post({ type: "error", text }),
      onDone: () => this.post({ type: "done" }),
    });
  }

  private html(): string {
    return /* html */ `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); margin: 0; display: flex; flex-direction: column; height: 100vh; }
  #log { flex: 1; overflow-y: auto; padding: 12px; }
  .msg { margin-bottom: 12px; white-space: pre-wrap; font-size: 13px; }
  .user { color: #e8ff47; }
  .err { color: #f48771; }
  #bar { display: flex; gap: 6px; padding: 8px; border-top: 1px solid var(--vscode-panel-border); }
  #input { flex: 1; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 6px; }
  button { background: #e8ff47; color: #000; border: none; padding: 6px 12px; cursor: pointer; font-weight: 600; }
</style>
</head>
<body>
  <div id="log"></div>
  <div id="bar">
    <input id="input" placeholder="Ask StackAI..." />
    <button id="send">Send</button>
  </div>
<script>
  const vscode = acquireVsCodeApi();
  const log = document.getElementById('log');
  const input = document.getElementById('input');
  let current = null;

  function add(cls, text) {
    const el = document.createElement('div');
    el.className = 'msg ' + cls;
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  document.getElementById('send').addEventListener('click', send);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    vscode.postMessage({ type: 'prompt', text });
  }

  window.addEventListener('message', (event) => {
    const m = event.data;
    if (m.type === 'user') add('user', 'You: ' + m.text);
    else if (m.type === 'start') current = add('assistant', '');
    else if (m.type === 'token' && current) current.textContent += m.text;
    else if (m.type === 'error') add('err', 'Error: ' + m.text);
    else if (m.type === 'done') current = null;
  });
</script>
</body>
</html>`;
  }
}

export { SECRET_KEY };
