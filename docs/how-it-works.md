---
icon: gears
description: The agent loop, tools, skills, and how the same engine runs across the terminal, web, and Telegram.
---

# How it works

## The agent loop

When you give StackAI a task, it runs a loop:

1. Your message + the system prompt + any project context go to the model.
2. The model replies, optionally calling **tools** (read a file, run a command, load a skill…).
3. StackAI executes the tools and feeds the results back.
4. Repeat until the model has nothing left to call, then it answers.

The model is the brain; the tools are its hands.

## The tools

| Tool | What it does |
|---|---|
| `read_file` / `write_file` / `edit_file` | Read and modify files |
| `list_files` / `create_dir` | Explore and create folders |
| `search_files` | Regex content search (grep) |
| `find_files` | Find files by glob (e.g. `src/**/*.ts`) |
| `run_command` | Run a shell command — **you approve each one** |
| `load_skill` | Load a skill's runbook when your request matches it |

Everything happens inside the directory you ran `stackai` in. Nothing touches files outside it.

{% hint style="warning" %}
**Command approval.** When the agent wants to run a shell command it pauses and asks: **`y`** (run once) · **`a`** (always, this session) · **`n`** (skip). Nothing runs without your OK, and the agent is told never to run destructive commands unless you explicitly asked.
{% endhint %}

## Skills

A [**skill**](skills.md) is a small Markdown runbook (a `SKILL.md`) that tells the agent how to do a specific task — what to do, which API to call, how to handle errors. The agent sees a short index of every skill's name and description. When your request matches one, it loads the full runbook and follows it, using `run_command` and the file tools to execute.

Skills are why StackAI can grow without new releases: a skill is just content, and you can [install more](installing-skills.md) from GitHub.

## Models

By default the agent runs on **MiMo v2.5 Pro** through StackAI's hosted proxy (this is the free tier, rate-limited server-side). You can [switch models](models.md) — for example to Venice — with `/model`. Venice is called directly with your own key, so it never goes through us.

## Same engine, three surfaces

The agent engine lives in one shared core, so every surface behaves the same:

* **CLI** — the agent loop runs **locally** on your machine. It has the file tools and `run_command`, so it can do full coding work. Trading/launch skills live here because your keys stay local.
* **Web (Vibe)** — a chat-to-project builder that runs server-side and hands you a `.zip`.
* **Telegram** — runs the agent **server-side** and is kept **read-only** on purpose: skills that move funds aren't loaded there. Great for quick crypto checks.

## Privacy & control

* Your StackAI API key authenticates you; the model key (MiMo) stays on our server, never in your hands to leak.
* For other providers (Venice) and Bankr, you **bring your own key**, and it stays on your machine (CLI).
* The agent only acts inside your current directory, and every command is gated by your approval.
