---
name: fear-greed
description: Show the crypto Fear & Greed Index (overall market sentiment, 0–100) with today vs yesterday. Use when the user asks about market sentiment, fear/greed, or "how's the market feeling".
capabilities: [external_api]
---

# Fear & Greed

Report the crypto Fear & Greed Index using the alternative.me public API (free, no key).

## When to use

The user asks about market sentiment, the fear/greed index, or whether the market is fearful/greedy right now.

## Steps

1. Run the bundled script (Node 20+, no key):
   ```
   node "{{SKILL_DIR}}/fng.mjs"
   ```
2. Present the value (0–100), its label (e.g. "Extreme Fear"), and the day-over-day trend.

## Rules

- 0 = extreme fear, 100 = extreme greed. Data is market-wide sentiment, not advice.
- Only report what the script returns.
