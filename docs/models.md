---
icon: microchip
description: Run StackAI on MiMo by default, or bring your own key to use Venice models.
---

# Models

StackAI runs on **Xiaomi MiMo v2.5 Pro** by default — routed through StackAI's hosted proxy, so it's part of the free tier and rate-limited server-side. You can switch to other models.

## Switch models

In an interactive session:

```
/model                       # show the current model
/model venice-uncensored     # switch to a Venice model
/model mimo                  # switch back to MiMo
```

The active model is shown in the session banner. To set a default for new sessions:

```bash
stackai model <id>           # e.g. stackai model llama-3.3-70b
stackai model mimo           # back to default
```

## Venice (bring your own key)

[Venice](https://venice.ai) is a privacy-first, OpenAI-compatible provider with open and uncensored models. StackAI calls Venice **directly with your own key** — it never goes through StackAI's servers.

```bash
stackai venice set <key>     # get one at venice.ai/settings/api
stackai venice models        # list available Venice text models
stackai venice clear         # remove the key
```

Your Venice key is stored locally in `~/.stackai/config.json` (or pass it via the `VENICE_API_KEY` environment variable). Once set, switch to any Venice model id with `/model <id>`.

{% hint style="warning" %}
**Tool calling.** The agent needs function/tool calling for skills and file editing. Not every Venice model supports it — pick a tool-capable model (e.g. a Llama or Qwen) for full agent use. Any model works for plain chat.
{% endhint %}

## How routing works

| Model | Where it runs | Key |
|---|---|---|
| `mimo` (default) | StackAI proxy (Railway) — free tier, rate-limited | Your StackAI key |
| Venice model id | Venice API, called directly | Your own Venice key |

More providers are coming. The same pattern applies: MiMo stays the free default, and other providers are bring-your-own-key.
