import { createReadStream } from 'fs';
import { access } from 'fs/promises';
import { createInterface } from 'readline';
import { getShortPath } from '../utils/paths';
import { debug } from '../utils/log';
import { RawLineSchema } from '../types';
import type { Session, RawSummaryLine, RawUserMessage, RawAssistantMessage } from '../types';

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

      // Parse JSON and validate with Zod
      let jsonData: unknown;
      try {
        jsonData = JSON.parse(line);
      } catch (err) {
        debug(`JSON parse error in ${filePath}:${lineNumber}`, err);
        continue;
      }

      const result = RawLineSchema.safeParse(jsonData);
      if (!result.success) {
        debug(`Schema validation error in ${filePath}:${lineNumber}`, result.error.message);
        continue;
      }

      const parsed = result.data;

      // First line is usually the summary
      if (parsed.type === 'summary' && lineNumber === 1) {
        summary = (parsed as RawSummaryLine).summary || '';
      }

      // Count user and assistant messages
      if (parsed.type === 'user') {
        messageCount++;
        const userMsg = parsed as RawUserMessage;

        // Get timestamp
        if (userMsg.timestamp) {
          const ts = new Date(userMsg.timestamp);
          if (!lastTimestamp || ts > lastTimestamp) {
            lastTimestamp = ts;
          }
        }

        // Get git branch from first user message
        if (!gitBranch && userMsg.gitBranch) {
          gitBranch = userMsg.gitBranch;
        }

        // Get actual project path from cwd
        if (!projectPath && userMsg.cwd) {
          projectPath = userMsg.cwd;
        }

        // If no summary, use first user message content as fallback
        if (!summary && userMsg.message?.content) {
          const content = userMsg.message.content;
          summary = typeof content === 'string'
            ? content.slice(0, 100)
            : 'Session';
        }
      }

      if (parsed.type === 'assistant') {
        messageCount++;
        const assistantMsg = parsed as RawAssistantMessage;

        // Get timestamp
        if (assistantMsg.timestamp) {
          const ts = new Date(assistantMsg.timestamp);
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

      let jsonData: unknown;
      try {
        jsonData = JSON.parse(line);
      } catch {
        continue;
      }

      const result = RawLineSchema.safeParse(jsonData);
      if (!result.success) continue;

      const parsed = result.data;

      if (parsed.type === 'user') {
        const userMsg = parsed as RawUserMessage;
        const content = userMsg.message?.content;
        if (content && typeof content === 'string') {
          messages.push({
            role: 'user',
            content,
            timestamp: userMsg.timestamp ? new Date(userMsg.timestamp) : undefined,
          });
        }
      }

      if (parsed.type === 'assistant') {
        const assistantMsg = parsed as RawAssistantMessage;
        // Extract text content from assistant message
        const textContent = assistantMsg.message?.content
          ?.filter((c): c is { type: 'text'; text: string } => c.type === 'text')
          .map((c) => c.text)
          .join('\n');

        if (textContent) {
          messages.push({
            role: 'assistant',
            content: textContent,
            timestamp: assistantMsg.timestamp ? new Date(assistantMsg.timestamp) : undefined,
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
