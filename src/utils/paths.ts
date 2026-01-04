import { homedir } from 'os';
import { join } from 'path';

/**
 * Get the Claude projects directory path
 */
export function getClaudeProjectsDir(): string {
  return join(homedir(), '.claude', 'projects');
}

/**
 * Decode an encoded project directory name back to the original path
 * e.g., "-Users-port-repos-foo" → "/Users/port/repos/foo"
 */
export function decodeProjectPath(encodedName: string): string {
  // Replace leading dash with /, then all other dashes with /
  // Handle edge case where the path might start without a dash
  if (encodedName.startsWith('-')) {
    return encodedName.replace(/-/g, '/');
  }
  return '/' + encodedName.replace(/-/g, '/');
}

/**
 * Get the short display path (last 2 segments)
 * e.g., "/Users/port/repos/experiments/historian" → "experiments/historian"
 */
export function getShortPath(fullPath: string): string {
  const segments = fullPath.split('/').filter(Boolean);
  if (segments.length <= 2) {
    return segments.join('/');
  }
  return segments.slice(-2).join('/');
}

/**
 * Check if a filename is a main session file (UUID format) vs agent session
 * Main sessions: "3b7f381f-6a26-4324-ad64-e1ae7800230f.jsonl"
 * Agent sessions: "agent-7833faff.jsonl" (skip these)
 */
export function isMainSessionFile(filename: string): boolean {
  // UUID pattern: 8-4-4-4-12 hex chars
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/i;
  return uuidPattern.test(filename);
}

/**
 * Extract session ID from filename
 */
export function getSessionIdFromFilename(filename: string): string {
  return filename.replace('.jsonl', '');
}
