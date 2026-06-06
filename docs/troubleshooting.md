# Troubleshooting

### `stackai: command not found`
Reopen your terminal so the PATH refreshes after `npm install -g stackai`.

### PowerShell: "running scripts is disabled on this system"
Run once (no admin needed):
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
Or call it directly: `stackai.cmd login`.

### `Error: 401` / Invalid API key
Your key is wrong, expired, or revoked. Create a fresh one in the
[Dashboard](https://usestackai.com) and run `stackai login` again.

### `429` / rate limit reached
You've hit the daily request limit (50/day on the free tier). Wait until
tomorrow, or use a different key.

### "Reached the step limit"
A complex task hit the per-run step ceiling. The agent stops gracefully —
just run the same prompt again to continue from where it left off.

### Interactive mode won't start
It needs a real terminal (TTY). If you're piping output or in a restricted
shell, use a one-shot instead: `stackai "your prompt"`.

### Still stuck?
Open an issue on [GitHub](https://github.com/Stackaiagent/Usestackai/issues).
