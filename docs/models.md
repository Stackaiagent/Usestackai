---
icon: microchip
description: Run StackAI on MiMo by default, or bring your own key to use Claude, GPT, Gemini, Grok, and more.
---

# Models

StackAI runs on **Xiaomi MiMo v2.5 Pro** by default — routed through StackAI's hosted proxy, so it's part of the free tier. You can switch to almost any other model by bringing your own key.

## Switch models

In an interactive session:

```
/model                 # show the current model
/model claude          # switch (alias)
/model mimo            # back to the free default
```

Set a default for new sessions:

```bash
stackai model <id>     # e.g. stackai model claude
stackai model mimo
```

## Bring your own key

The easiest way to unlock many models is **OpenRouter** — one key gives you Claude, GPT, Gemini, Grok, DeepSeek, and 300+ more.

```bash
stackai key set openrouter <key>     # get one at openrouter.ai/keys
stackai models openrouter            # list available models
```

Then pick a model by alias or full id:

| Alias | Goes to |
|---|---|
| `/model claude` | `anthropic/claude-opus-4.8` |
| `/model gpt` | `openai/gpt-5.5` |
| `/model gemini` | `google/gemini-3.5-flash` |
| `/model grok` | `x-ai/grok-4.3` |
| `/model deepseek` | `deepseek/deepseek-v3.2` |

Or any exact id: `/model openrouter:anthropic/claude-sonnet-latest`.

## Providers

Each provider is OpenAI-compatible and called directly with your own key (never through StackAI's servers).

| Provider | `key set` name | Notes |
|---|---|---|
| **MiMo** | — (default) | Free tier, via the StackAI proxy |
| **OpenRouter** | `openrouter` | One key → Claude, GPT, Gemini, Grok, and more |
| **Venice** | `venice` | Privacy-first, uncensored open models |
| **OpenAI** | `openai` | GPT directly |
| **xAI** | `xai` | Grok directly |
| **Google** | `google` | Gemini directly |

```bash
stackai key                          # show which provider keys are set
stackai key set <provider> <key>
stackai key clear <provider>
stackai models <provider>            # list a provider's models
```

Keys are stored locally in `~/.stackai/config.json` (or via env vars like `OPENROUTER_API_KEY`).

{% hint style="warning" %}
**Tool calling.** The agent needs function/tool calling for skills and file editing. Most frontier models (Claude, GPT, Gemini, Grok, DeepSeek) support it; some smaller/open models don't — pick a tool-capable model for full agent use. Any model works for plain chat.
{% endhint %}
