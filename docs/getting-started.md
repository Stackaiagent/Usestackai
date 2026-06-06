# Getting started

## 1. Install

Requires **Node.js 20+**.

```bash
npm install -g stackai
```

Verify:

```bash
stackai --version
```

> **PowerShell:** if you see "running scripts is disabled", run once:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## 2. Get an API key

1. Go to [usestackai.com](https://usestackai.com) and **sign in with X**.
2. Open the **Dashboard** → **Create key**.
3. Copy the key (`sk_live_…`) — it's shown only once.

## 3. Log in

```bash
stackai login
```

Paste your key when prompted (it's masked). Check it worked:

```bash
stackai whoami
```

## 4. Use it

Open an interactive session (recommended):

```bash
cd your-project
stackai
```

Type what you want, e.g. *"add a dark mode toggle to the navbar"*. Press Enter. `/exit` to quit.

Or run a one-shot command:

```bash
stackai "create a REST endpoint for users with validation"
```

That's it. Next: give the agent [project rules](project-context.md) so it codes to your conventions.
