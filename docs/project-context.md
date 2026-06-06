# Project context (STACKAI.md)

Drop a **`STACKAI.md`** file in the root of your project and StackAI reads it
automatically at the start of every session, then follows it. It's the easiest
way to teach the agent your stack and conventions — no need to re-explain each
time. (`AGENTS.md` also works.)

## Example

```markdown
# My Project

- Stack: Next.js 15 (App Router) + Tailwind + TypeScript (strict)
- Use named exports; default exports only for pages/components
- Tests live in `__tests__/`, run with `npm test`
- Never edit files in `generated/`
- Keep components small and prefer server components
```

## Tips

* Keep it short and specific — rules, conventions, "don't touch X".
* Mention how to run tests / build so the agent knows your workflow.
* List directories the agent should avoid.
* It's plain Markdown — anything you'd tell a new teammate works here.
