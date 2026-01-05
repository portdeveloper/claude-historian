#!/usr/bin/env bun
import { $ } from 'bun';
import { mkdir, writeFile, chmod } from 'fs/promises';

const targets = [
  { name: 'darwin-arm64', target: 'bun-darwin-arm64' },
  { name: 'darwin-x64', target: 'bun-darwin-x64' },
  { name: 'linux-x64', target: 'bun-linux-x64' },
  { name: 'linux-arm64', target: 'bun-linux-arm64' },
];

// Shell wrapper that handles launching Claude after TUI exits
const wrapper = `#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BINARY="\${SCRIPT_DIR}/.claude-historian-core"
LAUNCH_FILE="\${TMPDIR:-/tmp}/claude-historian-launch"

"\$BINARY" "$@"
exit_code=$?

if [ $exit_code -eq 100 ] && [ -f "\$LAUNCH_FILE" ]; then
    launch_cmd=$(cat "\$LAUNCH_FILE")
    rm -f "\$LAUNCH_FILE"
    eval "\$launch_cmd"
fi

exit $exit_code
`;

async function build() {
  console.log('Building claude-historian for all platforms...\n');

  for (const { name, target } of targets) {
    console.log(`Building for ${name}...`);
    const outdir = `dist/${name}`;
    await mkdir(outdir, { recursive: true });

    try {
      // Build core binary (hidden file)
      await $`bun build src/index.tsx --compile --target=${target} --outfile=${outdir}/.claude-historian-core`;

      // Create wrapper script
      await writeFile(`${outdir}/claude-historian`, wrapper);
      await chmod(`${outdir}/claude-historian`, 0o755);

      console.log(`  ✓ ${name} built successfully`);
    } catch (error) {
      console.error(`  ✗ Failed to build ${name}:`, error);
    }
  }

  console.log('\nBuild complete! Binaries are in dist/');
}

build();
