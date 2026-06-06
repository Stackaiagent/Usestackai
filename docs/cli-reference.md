# CLI reference

| Command | What it does |
|---|---|
| `stackai` | Start an interactive chat session (keeps context across messages) |
| `stackai "<prompt>"` | Run the agent once on the current directory, then exit |
| `stackai login` | Log in — prompts for your API key (masked) |
| `stackai login <key>` | Log in directly with a key |
| `stackai logout` | Remove your saved API key |
| `stackai whoami` | Show the current user + today's usage |
| `stackai --help` | Show all commands |
| `stackai --version` | Print the version |
| `stackai auth <key> <url>` | Advanced: save a key with a custom API URL |

## What the agent can do

Inside a run, the agent has these tools:

* **read_file / write_file / edit_file** — read and modify files
* **list_files / create_dir** — explore and create folders
* **search_files** — regex content search across the project (grep)
* **find_files** — find files by glob pattern (e.g. `src/**/*.ts`)

It works only inside your current directory and shows each action live
(`● Write(file)`, `● Edit(file)`, etc.) with a diff preview.

## Config

Your key is saved to `~/.stackai/config.json`. Override the API URL per-machine
with the `STACKAI_API_URL` environment variable.

## Notes

* Each step the agent takes counts as one request against your daily limit.
* Interactive mode needs a real terminal (not a piped/non-TTY shell).
