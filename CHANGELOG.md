# Changelog

All notable changes to this project will be documented in this file.

## [0.2.3] - 2025-01-04

### Changed
- Parallelize session parsing with Promise.all for faster startup
- Remove Zod validation, use direct JSON property access
- Reduced bundle from 617 to 540 modules
- Session loading now ~180ms for 184 sessions

## [0.2.2] - 2025-01-04

### Added
- ASCII art banner in install script and README

## [0.2.1] - 2025-01-04

### Added
- `ch` shortcut symlink for quicker access
- LICENSE file (MIT)
- CHANGELOG.md

### Fixed
- Version mismatch in CLI (was showing 0.1.0 instead of 0.2.0)

## [0.2.0] - 2025-01-04

### Added
- Fuzzy search with `/` key for filtering sessions
- Bulk delete with `x` to mark and `d` to delete marked sessions
- Session preview modal with `Space` or `p` key
- Help overlay with `?` key
- Refresh list with `r` key
- Go to top/bottom with `g`/`G` keys

### Fixed
- Preview shortcut now shown in status bar
- Improved error handling, input validation, and resource cleanup
- Use unique index-based keys in ProjectTree to avoid React warnings

### Changed
- Updated documentation with new features and keyboard shortcuts

## [0.1.0] - 2025-01-03

### Added
- Initial release of claude-historian
- Interactive TUI for browsing Claude Code sessions
- Sessions organized by project path
- Keyboard navigation (arrow keys, Enter to select)
- Collapse/expand projects with left/right arrows
- Git branch display for each session
- Relative time formatting
- Sessions from deleted folders grouped separately
- Multi-platform builds (macOS arm64/x64, Linux x64/arm64)
- Installation script for easy setup
