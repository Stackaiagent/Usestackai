---
icon: brain
description: StackAI remembers your preferences and project facts across sessions.
---

# Agent memory

By default an agent forgets everything between sessions. StackAI's **memory** lets it keep durable facts and preferences across sessions, so you don't repeat yourself.

## What it remembers

* **Preferences** — "I use pnpm, not npm", "always TypeScript strict", "keep answers short"
* **Project facts** — "the API is in `apps/api`", "deploys to Railway"
* **Anything you ask** — just say *"remember that …"*

It does **not** save ephemeral, one-off details.

## How it works

* **Two scopes:**
  * **User** — personal preferences that apply in every project (`~/.stackai/memory.md`)
  * **Project** — facts about the current codebase (`./.stackai/memory.md`)
* **Auto + manual** — the agent saves clear durable facts on its own, and you can steer it: *"remember I trade on Base"* or *"forget my old wallet"*.
* **Loaded each session** — at startup, your memory is given to the agent as known context (the same way [`STACKAI.md`](project-context.md) is).
* **Local only** — memory files live on your machine and are never sent to a server.

When the agent saves or removes a fact you'll see it inline: `● Remember(...)` / `● Forget(...)`.

## Commands

```bash
stackai memory                 # show what's remembered (user + project)
stackai memory clear           # clear everything
stackai memory clear user      # clear just user (or: project)
```

You can also edit the markdown files directly. The project file (`./.stackai/memory.md`) can be committed to share team context, or git-ignored to keep it personal.

{% hint style="info" %}
Memory is CLI-only for now (local files). Per-user memory on Telegram is planned.
{% endhint %}
