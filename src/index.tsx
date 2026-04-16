#!/usr/bin/env bun
import { render } from 'ink';
import { program } from 'commander';
import { App } from './ui/App';

program
  .name('claude-historian')
  .description('Interactive browser for Claude Code sessions')
  .version('0.2.0')
  .option('--dsp', 'resume sessions with --dangerously-skip-permissions')
  .action((opts) => {
    render(<App skipPermissions={Boolean(opts.dsp)} />);
  });

program.parse();
