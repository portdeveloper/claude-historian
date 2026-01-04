import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { getShortPath } from '../utils/paths';
import type { Session, RawLine, RawSummaryLine, RawUserMessage, RawAssistantMessage } from '../types';

/**
 * Parse a session .jsonl file and extract metadata
 */
export async function parseSessionFile(
  filePath: string,
  projectPath: string,
  sessionId: string
): Promise<Session> {
  let summary = '';
  let messageCount = 0;
  let lastTimestamp: Date | null = null;
  let gitBranch: string | undefined;

  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const parsed: RawLine = JSON.parse(line);
      lineNumber++;

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
    } catch {
      // Skip malformed lines
      continue;
    }
  }

  return {
    id: sessionId,
    filePath,
    projectPath,
    shortPath: getShortPath(projectPath),
    summary: summary || 'Untitled session',
    updatedAt: lastTimestamp || new Date(0),
    messageCount,
    gitBranch,
  };
}
