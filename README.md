# claude-historian

Interactive CLI browser for Claude Code sessions. Navigate your projects and sessions in a tree view, and resume any session with a single keystroke.

```
$ claude-historian

▼ experiments/historian (3 sessions)
    ├── Initial planning session  [main]     just now    12 msgs
    ├── Research claude code plugins         1 hour ago  8 msgs
    └── Setup project structure   [dev]      2 hours ago 5 msgs
▼ buidlguidl/abi.ninja (2 sessions)
    ├── Fix contract parsing      [main]     1 day ago   28 msgs
    └── Add ABI validation                   1 week ago  15 msgs
▶ buidlguidl/extractor (10 sessions)
▶ Sessions from deleted folders (133)

[↑↓ move] [space preview] [x mark] [d delete] [/ search] [? help] [q quit]
```

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/portdeveloper/claude-historian/main/install.sh | bash
```

Or download the binary directly from [GitHub Releases](https://github.com/portdeveloper/claude-historian/releases).

## Usage

Run `claude-historian` in any directory:

```bash
claude-historian
```

### Keyboard Controls

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate up/down |
| `←` / `→` | Collapse/expand project |
| `Enter` | Select (expand project or launch session) |
| `Space` / `p` | Preview session messages |
| `g` / `G` | Go to top / bottom |
| `x` | Mark/unmark session |
| `X` | Mark/unmark all visible sessions |
| `d` | Delete session(s) (marked or current) |
| `r` | Refresh list |
| `/` | Search/filter (fuzzy) |
| `?` | Show help overlay |
| `q` / `Esc` | Quit |

## Features

- **Hierarchical view**: Projects grouped with sessions nested underneath
- **Git branch display**: See which branch each session was on
- **Recent first**: Sessions sorted by most recent activity
- **Fuzzy search**: Filter projects and sessions with intelligent matching
- **Session preview**: View the first few messages without leaving the app
- **Bulk delete**: Mark multiple sessions and delete them at once
- **Direct launch**: Select a session to immediately resume with `claude --resume`
- **Orphaned sessions**: Sessions from deleted folders grouped separately
- **Agent sessions hidden**: Only shows main conversation sessions

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.0+

### Setup

```bash
bun install
```

### Run locally

```bash
bun run dev
```

### Build standalone binary

```bash
# Current platform only
bun run build:local

# All platforms
bun run build
```

## How it works

claude-historian scans `~/.claude/projects/` for session files (`.jsonl`), parses their metadata (summary, timestamps, message count), and displays them in an interactive tree view using [Ink](https://github.com/vadimdemedes/ink).

When you select a session, it launches `claude --resume <session-id>` in the project directory.

## License

MIT
