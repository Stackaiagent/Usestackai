---
icon: lightbulb
description: Real prompts that show what StackAI can do in a codebase.
---

# Examples

A few prompts to get a feel for it. Run them inside a project (`cd your-project` first), in interactive mode or one-shot.

## Refactor

```bash
stackai "convert all .then() chains in src/api to async/await"
```

```bash
stackai "extract the duplicated fetch logic into a useApi hook"
```

## Add a feature

```bash
stackai "add a dark mode toggle to the navbar, persist it in localStorage"
```

```bash
stackai "create a REST endpoint POST /users with zod validation and tests"
```

## Understand a codebase

```bash
stackai "where is auth handled, and how are sessions stored?"
```

{% hint style="info" %}
The agent uses **search\_files** (grep) and **find\_files** (glob) to explore before answering — so questions like this work even in a repo it's never seen.
{% endhint %}

## Fix & clean up

```bash
stackai "find and fix any TODO comments left in src/"
```

```bash
stackai "add input validation to every route handler that's missing it"
```

## Tips for better results

* Be specific about **files or folders** when you can (`in src/routes`, `the Button component`).
* Add a [`STACKAI.md`](project-context.md) so you don't repeat your conventions every time.
* For big tasks, let it run, then ask follow-ups in the same interactive session — it keeps context.
