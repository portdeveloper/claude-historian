import { createReadStream } from 'fs';
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

  // Cleanup resources
  rl.close();
  fileStream.destroy();

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
