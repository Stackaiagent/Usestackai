---
icon: circle-question
description: Quick answers about pricing, models, privacy, and platforms.
---

# FAQ

<details>
<summary>What model powers StackAI?</summary>

**Xiaomi MiMo v2.5 Pro**, with a **1M token** context window — large enough to reason over big codebases.
</details>

<details>
<summary>How much does it cost?</summary>

The free tier gives **50 requests/day**. Each step the agent takes counts as one request. Higher tiers are available — see the [Dashboard](https://usestackai.com).
</details>

<details>
<summary>Does it edit my real files?</summary>

Yes. The CLI agent runs **locally** and reads/writes the actual files in your current directory. It shows every change live with a diff, and it never touches anything outside the directory you ran it in.
</details>

<details>
<summary>How is this different from Vibe?</summary>

The **CLI** works on your existing local project. **Vibe** (on the web) generates a brand-new static project from a chat and hands you a `.zip`. Same model, different surface.
</details>

<details>
<summary>How do I sign in?</summary>

Sign in with **X (Twitter)** at [usestackai.com](https://usestackai.com), then create an API key in the Dashboard.
</details>

<details>
<summary>Can I keep my conventions across sessions?</summary>

Yes — add a [`STACKAI.md`](project-context.md) to your project root. The agent reads it automatically at the start of every session.
</details>

<details>
<summary>It's open source?</summary>

Yes — the code lives on [GitHub](https://github.com/Stackaiagent/Usestackai).
</details>
