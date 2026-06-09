---
icon: download
description: Install skills from any GitHub repo, and write your own.
---

# Installing skills

StackAI is a skill platform: anyone can publish a skill in a GitHub repo, and you install it with one command.

## Install a skill

```bash
stackai skill add <owner/repo> [path]
```

* `<owner/repo>` — a public GitHub repo (or a full `github.com/...` URL)
* `[path]` — optional sub-folder, when the skill lives in a subdirectory

The target folder must contain a `SKILL.md`. StackAI downloads it (and any bundled scripts) into `~/.stackai/skills/`.

**Example — install Bankr's official skill:**

```bash
stackai skill add BankrBot/skills bankr
```

{% hint style="warning" %}
Installed skills can run commands on your machine (behind the [approval prompt](how-it-works.md)). **Only install skills you trust** — read the `SKILL.md` first if you're unsure.
{% endhint %}

## Manage skills

```bash
stackai skill                 # list all skills (built-in + installed)
stackai skill remove <name>   # remove an installed skill
```

Installed skills live in `~/.stackai/skills/`. If an installed skill has the **same name** as a built-in one, the installed version wins — so you can override a built-in with a richer community version.

## Writing your own skill

A skill is a folder with a `SKILL.md` (plus any scripts it needs):

```
my-skill/
├── SKILL.md
└── script.mjs        # optional
```

```markdown
---
name: my-skill
description: What this does and when the agent should use it.
capabilities: [external_api]
---

# My Skill

## When to use
...the trigger conditions...

## Steps
1. Run the bundled script:
   `node "{{SKILL_DIR}}/script.mjs" <arg>`
2. Present the result.

## Rules
- Only report what the script returns.
```

* **Frontmatter** — `name`, `description` (this is what the agent matches on), and `capabilities` (use `onchain_writes` for anything that moves funds, so it's kept off read-only surfaces).
* **`{{SKILL_DIR}}`** in the body is replaced with the skill's absolute folder path at runtime, so bundled scripts resolve correctly.
* **Bundled scripts** run via `run_command` — write them in Node (Node 20+ has global `fetch`, no extra deps needed) for a cross-platform skill.

Push the folder to a GitHub repo and anyone can `stackai skill add <your/repo> my-skill`.
