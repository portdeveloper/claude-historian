#!/bin/bash
# Dev wrapper for testing the shell wrapper approach
LAUNCH_FILE="${TMPDIR:-/tmp}/claude-historian-launch"

bun run src/index.tsx "$@"
exit_code=$?

if [ $exit_code -eq 100 ] && [ -f "$LAUNCH_FILE" ]; then
    launch_cmd=$(cat "$LAUNCH_FILE")
    rm -f "$LAUNCH_FILE"
    eval "$launch_cmd"
fi

exit $exit_code
