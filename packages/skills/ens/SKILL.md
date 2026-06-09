---
name: ens
description: Resolve an ENS name to its address (or an address to its ENS name), with avatar. Use when the user gives a name like vitalik.eth, or asks "what's the ENS for 0x…" / "what address is name.eth".
capabilities: [external_api]
---

# ENS

Resolve ENS names and addresses both ways, using the ENS public resolver (free, no key).

## When to use

The user gives an ENS name (`*.eth`) and wants the address, or gives an address and wants its ENS name.

## Steps

1. Run the bundled script (Node 20+, no key):
   ```
   node "{{SKILL_DIR}}/ens.mjs" <name.eth | 0xaddress>
   ```
2. Present the resolved address and/or ENS name (and avatar if present).
   - If the output starts with `NOT_FOUND`, tell the user that name/address has no ENS record.

## Rules

- Works both directions (name → address, address → name).
- Only report what the script returns.
