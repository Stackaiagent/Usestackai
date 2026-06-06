---
icon: rocket
description: Install, log in, and run your first agent in under two minutes.
---

# Getting started

{% stepper %}
{% step %}
### Install

Requires **Node.js 20+**.

```bash
npm install -g stackai
```

Verify it's on your PATH:

```bash
stackai --version
```

{% hint style="info" %}
**Windows / PowerShell:** if you see *"running scripts is disabled on this system"*, run once (no admin needed):
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
{% endhint %}
{% endstep %}

{% step %}
### Get an API key

1. Go to [usestackai.com](https://usestackai.com) and **sign in with X**.
2. Open the **Dashboard** → **Create key**.
3. Copy the key (`sk_live_…`) — it's shown only once.
{% endstep %}

{% step %}
### Log in

```bash
stackai login
```

Paste your key when prompted (it's masked). Check it worked:

```bash
stackai whoami
```
{% endstep %}

{% step %}
### Use it

{% tabs %}
{% tab title="Interactive (recommended)" %}
```bash
cd your-project
stackai
```

Type what you want, e.g. *"add a dark mode toggle to the navbar"*, and press Enter. Context is kept across messages. Type `/exit` to quit.
{% endtab %}

{% tab title="One-shot" %}
```bash
stackai "create a REST endpoint for users with validation"
```

Runs once on the current directory, prints what it changed, then exits.
{% endtab %}
{% endtabs %}
{% endstep %}
{% endstepper %}

{% hint style="success" %}
**Next:** give the agent [project rules](project-context.md) so it codes to your conventions automatically.
{% endhint %}
