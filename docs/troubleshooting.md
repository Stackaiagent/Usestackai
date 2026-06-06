---
icon: life-ring
description: Common errors and how to fix them fast.
---

# Troubleshooting

<details>
<summary><code>stackai: command not found</code></summary>

Reopen your terminal so the PATH refreshes after `npm install -g stackai`.
</details>

<details>
<summary>PowerShell: "running scripts is disabled on this system"</summary>

Run once (no admin needed):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Or call it directly: `stackai.cmd login`.
</details>

<details>
<summary><code>Error: 401</code> / Invalid API key</summary>

Your key is wrong, expired, or revoked. Create a fresh one in the [Dashboard](https://usestackai.com) and run `stackai login` again.
</details>

<details>
<summary><code>429</code> / rate limit reached</summary>

You've hit the daily request limit (50/day on the free tier). Wait until tomorrow, or use a different key.
</details>

<details>
<summary>"Reached the step limit"</summary>

A complex task hit the per-run step ceiling. The agent stops gracefully — just run the same prompt again to continue from where it left off.
</details>

<details>
<summary>Interactive mode won't start</summary>

It needs a real terminal (TTY). If you're piping output or in a restricted shell, use a one-shot instead: `stackai "your prompt"`.
</details>

{% hint style="info" %}
**Still stuck?** Open an issue on [GitHub](https://github.com/Stackaiagent/Usestackai/issues).
{% endhint %}
