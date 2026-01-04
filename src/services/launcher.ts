import { spawn } from 'child_process';
import { unlink } from 'fs/promises';

/**
 * Launch Claude Code with a specific session
 */
export function launchSession(sessionId: string, cwd: string): void {
  // Spawn claude --resume in the project directory
  const child = spawn('claude', ['--resume', sessionId], {
    cwd,
    stdio: 'inherit',
    detached: false,
  });

  // Handle errors
  child.on('error', (err) => {
    console.error('Failed to launch Claude:', err.message);
    process.exit(1);
  });

  // Exit when Claude exits
  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

/**
 * Delete a session file
 */
export async function deleteSession(filePath: string): Promise<void> {
  await unlink(filePath);
}
