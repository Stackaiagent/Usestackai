import * as vscode from "vscode";
import { StackAIPanel, SECRET_KEY } from "./panel.js";
import { verifyKey } from "./api.js";

export function activate(context: vscode.ExtensionContext): void {
  const panel = new StackAIPanel(context.extensionUri, context.secrets);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(StackAIPanel.viewType, panel),

    // StackAI: Set API Key → stored in SecretStorage (never settings.json)
    vscode.commands.registerCommand("stackai.setApiKey", async () => {
      const key = await vscode.window.showInputBox({
        prompt: "Enter your StackAI API key",
        placeHolder: "sk_live_...",
        password: true,
        ignoreFocusOut: true,
      });
      if (!key) return;
      const ok = await verifyKey(key);
      if (!ok) {
        void vscode.window.showErrorMessage("StackAI: that API key is invalid.");
        return;
      }
      await context.secrets.store(SECRET_KEY, key);
      void vscode.window.showInformationMessage("StackAI: API key saved.");
    }),

    // StackAI: Open Panel
    vscode.commands.registerCommand("stackai.openPanel", () => {
      void vscode.commands.executeCommand("stackai.panel.focus");
    }),

    // StackAI: Run on File → sends the active file's content as context
    vscode.commands.registerCommand("stackai.runOnFile", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        void vscode.window.showWarningMessage("StackAI: no active file.");
        return;
      }
      const instruction = await vscode.window.showInputBox({
        prompt: "What should StackAI do with this file?",
        ignoreFocusOut: true,
      });
      if (!instruction) return;

      const fileName = editor.document.fileName;
      const content = editor.document.getText();
      const prompt = `File: ${fileName}\n\n${content}\n\nInstruction: ${instruction}`;
      await panel.run(prompt);
    }),
  );
}

export function deactivate(): void {
  // no-op
}
