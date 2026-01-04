# Claude Historian

A standalone CLI tool for browsing and resuming Claude Code sessions.

## Project Overview

Claude Historian provides an interactive TUI (terminal user interface) to navigate your Claude Code session history organized by project. Select a session and resume it directly.

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **TUI Framework**: Ink (React for terminals)
- **Build**: Bun's bundler with `--compile` for standalone binaries

## Project Structure

```
src/
├── index.tsx          # Entry point, renders <App />
├── cli.ts             # Commander CLI setup
├── ui/
│   ├── App.tsx        # Main component, state management, keyboard handling
│   ├── ProjectTree.tsx # Renders visible slice of projects/sessions
│   ├── ProjectRow.tsx  # Single project row (collapsible)
│   ├── SessionRow.tsx  # Single session row (summary, branch, time, msgs)
│   ├── SearchInput.tsx # Filter input
│   └── StatusBar.tsx   # Bottom bar with keyboard hints
├── services/
│   ├── scanner.ts     # Discovers sessions from ~/.claude/projects/
│   ├── parser.ts      # Parses .jsonl files, extracts metadata
│   └── launcher.ts    # Spawns `claude --resume <id>`
├── utils/
│   ├── paths.ts       # Path utilities (decode, short path)
│   └── time.ts        # Relative time formatting
└── types/
    └── index.ts       # TypeScript interfaces
```

## Key Concepts

### Session Storage
Claude Code stores sessions at `~/.claude/projects/{encoded-path}/*.jsonl`
- Main sessions: `{uuid}.jsonl`
- Agent sessions: `agent-{hash}.jsonl` (ignored by historian)

### Path Handling
Folder names encode paths with hyphens, but dots also become hyphens (ambiguous).
We extract the actual `cwd` from the first user message in each session file instead of decoding folder names.

### Viewport Scrolling
The tree view uses viewport scrolling with `scrollOffset` and `visibleHeight` to handle large session lists without re-rendering everything.

## Commands

```bash
# Development
bun run dev              # Run in dev mode
bun run src/index.tsx    # Run directly

# Build
bun build src/index.tsx --compile --outfile dist/claude-historian

# Test locally
./dist/claude-historian
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate |
| ←/→ | Collapse/expand |
| Enter | Select session to resume |
| g | Go to top |
| G | Go to bottom |
| d | Delete session (with confirmation) |
| r | Refresh list |
| / | Search |
| ? | Help overlay |
| q | Quit |

## Code Patterns

- State management via React hooks in App.tsx
- Flat item list for keyboard navigation (projects + sessions flattened with indices)
- Sessions grouped by actual project path (from cwd, not folder name)
- Missing project directories grouped under "Sessions from deleted folders"
