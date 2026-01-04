# claude-historian

Interactive CLI browser for Claude Code sessions. Navigate your projects and sessions in a tree view, and resume any session with a single keystroke.

```
$ claude-historian

▼ experiments/historian (3 sessions)
    ├── Initial planning session       just now    12 msgs
    ├── Research claude code plugins   1 hour ago  8 msgs
    └── Setup project structure        2 hours ago 5 msgs
▼ experiments/collab-dict (12 sessions)
    ├── Teacher login feature          1 month ago 28 msgs
    └── Word wall animation            1 month ago 15 msgs
▶ buidlguidl/extractor (18 sessions)

[↑↓ navigate] [←→ expand/collapse] [enter select] [/ search] [q quit]
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
| `←` | Collapse project / go to parent |
| `→` | Expand project |
| `Enter` | Select (expand project or launch session) |
| `/` | Search/filter |
| `Esc` | Cancel search |
| `q` | Quit |

## Features

- **Hierarchical view**: Projects grouped with sessions nested underneath
- **Recent first**: Sessions sorted by most recent activity
- **Quick search**: Filter projects and sessions by typing `/`
- **Direct launch**: Select a session to immediately resume with `claude --resume`
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
