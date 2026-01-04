#!/usr/bin/env bun
import { $ } from 'bun';
import { mkdir } from 'fs/promises';

const targets = [
  { name: 'darwin-arm64', target: 'bun-darwin-arm64' },
  { name: 'darwin-x64', target: 'bun-darwin-x64' },
  { name: 'linux-x64', target: 'bun-linux-x64' },
  { name: 'linux-arm64', target: 'bun-linux-arm64' },
];

async function build() {
  console.log('Building claude-historian for all platforms...\n');

  for (const { name, target } of targets) {
    console.log(`Building for ${name}...`);
    const outdir = `dist/${name}`;
    await mkdir(outdir, { recursive: true });

    try {
      await $`bun build src/index.tsx --compile --target=${target} --outfile=${outdir}/claude-historian`;
      console.log(`  ✓ ${name} built successfully`);
    } catch (error) {
      console.error(`  ✗ Failed to build ${name}:`, error);
    }
  }

  console.log('\nBuild complete! Binaries are in dist/');
}

build();
