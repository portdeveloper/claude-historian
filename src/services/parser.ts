import { createReadStream } from 'fs';
import { access } from 'fs/promises';
import { createInterface } from 'readline';
import { getShortPath } from '../utils/paths';
import { debug } from '../utils/log';
import type { Session } from '../types';

// Lightweight type guard - no Zod overhead
function getLineType(data: unknown): string | null {
  if (typeof data === 'object' && data !== null && 'type' in data) {
    const type = (data as Record<string, unknown>).type;
    return typeof type === 'string' ? type : null;
  }
  return null;
}

/**
 * Parse a session .jsonl file and extract metadata
 */
export async function parseSessionFile(
  filePath: string,
  fallbackProjectPath: string,
  sessionId: string
): Promise<Session> {
  // Check file exists before opening stream
  try {
    await access(filePath);
  } catch {
    throw new Error(`Session file not found: ${filePath}`);
  }

  let summary = '';
  let messageCount = 0;
  let lastTimestamp: Date | null = null;
  let gitBranch: string | undefined;
  let projectPath: string | undefined;

  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;

  try {
    for await (const line of rl) {
      if (!line.trim()) continue;
      lineNumber++;

      // Parse JSON directly - skip Zod for performance
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(line);
      } catch (err) {
        debug(`JSON parse error in ${filePath}:${lineNumber}`, err);
        continue;
      }

      const lineType = getLineType(parsed);
      if (!lineType) continue;

      // First line is usually the summary
      if (lineType === 'summary' && lineNumber === 1) {
        summary = typeof parsed.summary === 'string' ? parsed.summary : '';
      }

      // Count user and assistant messages
      if (lineType === 'user') {
        messageCount++;

        // Get timestamp
        if (typeof parsed.timestamp === 'string') {
          const ts = new Date(parsed.timestamp);
          if (!lastTimestamp || ts > lastTimestamp) {
            lastTimestamp = ts;
          }
        }

        // Get git branch from first user message
        if (!gitBranch && typeof parsed.gitBranch === 'string') {
          gitBranch = parsed.gitBranch;
        }

        // Get actual project path from cwd
        if (!projectPath && typeof parsed.cwd === 'string') {
          projectPath = parsed.cwd;
        }

        // If no summary, use first user message content as fallback
        if (!summary) {
          const message = parsed.message as Record<string, unknown> | undefined;
          const content = message?.content;
          if (typeof content === 'string') {
            summary = content.slice(0, 100);
          }
        }
      }

      if (lineType === 'assistant') {
        messageCount++;

        // Get timestamp
        if (typeof parsed.timestamp === 'string') {
          const ts = new Date(parsed.timestamp);
          if (!lastTimestamp || ts > lastTimestamp) {
            lastTimestamp = ts;
          }
        }
      }

      // Early exit: if we have all metadata, stop reading
      if (summary && projectPath && gitBranch) {
        break;
      }
    }
  } finally {
    // Cleanup resources - always runs even on exception
    rl.close();
    fileStream.destroy();
  }

  const finalProjectPath = projectPath || fallbackProjectPath;

  return {
    id: sessionId,
    filePath,
    projectPath: finalProjectPath,
    shortPath: getShortPath(finalProjectPath),
    summary: summary || 'Untitled session',
    updatedAt: lastTimestamp || new Date(0),
    messageCount,
    gitBranch,
  };
}

export interface PreviewMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

/**
 * Parse session messages for preview display
 */
export async function parseSessionMessages(
  filePath: string,
  limit: number = 10
): Promise<PreviewMessage[]> {
  try {
    await access(filePath);
  } catch {
    return [];
  }

  const messages: PreviewMessage[] = [];
  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  try {
    for await (const line of rl) {
      if (!line.trim()) continue;
      if (messages.length >= limit) break;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue;
      }

      const lineType = getLineType(parsed);
      if (!lineType) continue;

      if (lineType === 'user') {
        const message = parsed.message as Record<string, unknown> | undefined;
        const content = message?.content;
        if (typeof content === 'string') {
          messages.push({
            role: 'user',
            content,
            timestamp: typeof parsed.timestamp === 'string' ? new Date(parsed.timestamp) : undefined,
          });
        }
      }

      if (lineType === 'assistant') {
        const message = parsed.message as Record<string, unknown> | undefined;
        const contentArr = message?.content as Array<Record<string, unknown>> | undefined;

        // Extract text content from assistant message
        const textContent = contentArr
          ?.filter((c) => c.type === 'text' && typeof c.text === 'string')
          .map((c) => c.text as string)
          .join('\n');

        if (textContent) {
          messages.push({
            role: 'assistant',
            content: textContent,
            timestamp: typeof parsed.timestamp === 'string' ? new Date(parsed.timestamp) : undefined,
          });
        }
      }
    }
  } finally {
    rl.close();
    fileStream.destroy();
  }

  return messages;
}
