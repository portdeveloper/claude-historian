import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Launch Claude Code with a specific session
 */
export function launchSession(sessionId: string, cwd: string): void {
  // Validate inputs
  if (!sessionId || sessionId.trim() === '') {
    console.error('Error: sessionId is required');
    process.exit(1);
  }

  if (!cwd || !existsSync(cwd)) {
    console.error(`Error: directory does not exist: ${cwd}`);
    process.exit(1);
  }

  // Reset terminal state before spawning (Ink may have left raw mode enabled)
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }

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
export async function deleteSession(filePath: string): Promise<DeleteResult> {
  try {
    await unlink(filePath);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
