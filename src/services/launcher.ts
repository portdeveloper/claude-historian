import { existsSync, writeFileSync } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export interface DeleteResult {
  success: boolean;
  error?: string;
}

// Temp file where we write the launch command for the shell wrapper
export const LAUNCH_FILE = join(tmpdir(), 'claude-historian-launch');

/**
 * Launch Claude Code with a specific session
 * Writes command to temp file and exits - shell wrapper will exec it
 */
export function launchSession(sessionId: string, cwd: string, skipPermissions = false): void {
  // Validate inputs
  if (!sessionId || sessionId.trim() === '') {
    console.error('Error: sessionId is required');
    process.exit(1);
  }

  if (!cwd || !existsSync(cwd)) {
    console.error(`Error: directory does not exist: ${cwd}`);
    process.exit(1);
  }

  // Write launch info to temp file for shell wrapper to exec
  const dspFlag = skipPermissions ? ' --dangerously-skip-permissions' : '';
  const launchCmd = `cd ${JSON.stringify(cwd)} && exec claude --resume ${sessionId}${dspFlag}`;
  writeFileSync(LAUNCH_FILE, launchCmd);

  // Exit with special code 100 to signal "launch session"
  process.exit(100);
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
