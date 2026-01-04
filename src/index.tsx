#!/usr/bin/env bun
import { render } from 'ink';
import { program } from 'commander';
import { App } from './ui/App';

program
  .name('claude-historian')
  .description('Interactive browser for Claude Code sessions')
  .version('0.2.0')
  .action(() => {
    render(<App />);
  });

program.parse();
