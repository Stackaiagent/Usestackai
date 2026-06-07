---
icon: terminal
description: Every command, flag, and tool the StackAI CLI gives you.
---

# CLI reference

## Commands

| Command | What it does |
|---|---|
| `stackai` | Start an interactive chat session (keeps context across messages) |
| `stackai "<prompt>"` | Run the agent once on the current directory, then exit |
| `stackai login` | Log in — prompts for your API key (masked) |
| `stackai login <key>` | Log in directly with a key |
| `stackai logout` | Remove your saved API key |
| `stackai whoami` | Show the current user + today's usage |
| `stackai --help` | Show all commands |
| `stackai --version` | Print the version |
| `stackai auth <key> <url>` | Advanced: save a key with a custom API URL |

## What the agent can do

Inside a run, the agent has these tools:

| Tool | Purpose |
|---|---|
| `read_file` / `write_file` / `edit_file` | Read and modify files |
| `list_files` / `create_dir` | Explore and create folders |
| `search_files` | Regex content search across the project (grep) |
| `find_files` | Find files by glob pattern (e.g. `src/**/*.ts`) |
| `run_command` | Run a shell command (tests, build, install, git) — **you approve each one** |

It works **only inside your current directory** and shows each action live (`● Write(file)`, `● Edit(file)`, `● Run(cmd)`, …) with a diff/output preview.

{% hint style="warning" %}
**Command approval:** when the agent wants to run a shell command, StackAI pauses and asks: **`y`** (run once) · **`a`** (always, for the rest of this session) · **`n`** (skip). Nothing runs without your OK. The agent is told never to run destructive commands unless you explicitly asked.
{% endhint %}

## Config

Your key is saved to `~/.stackai/config.json`. Override the API URL per-machine with the `STACKAI_API_URL` environment variable.

{% hint style="warning" %}
Each step the agent takes counts as **one request** against your daily limit. A complex multi-file task can use several.
{% endhint %}

{% hint style="info" %}
Interactive mode needs a **real terminal (TTY)**. In a piped or non-TTY shell, use a one-shot instead: `stackai "your prompt"`.
{% endhint %}
