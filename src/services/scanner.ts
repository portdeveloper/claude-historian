import { readdir } from 'fs/promises';
import { join } from 'path';
import {
  getClaudeProjectsDir,
  decodeProjectPath,
  getShortPath,
  isMainSessionFile,
  getSessionIdFromFilename
} from '../utils/paths';
import { parseSessionFile } from './parser';
import type { Project, Session } from '../types';

interface SessionFile {
  filePath: string;
  projectPath: string;
  sessionId: string;
}

/**
 * Discover all session files from ~/.claude/projects/
 */
async function discoverSessionFiles(): Promise<SessionFile[]> {
  const projectsDir = getClaudeProjectsDir();
  const sessionFiles: SessionFile[] = [];

  try {
    const projectDirs = await readdir(projectsDir);

    for (const encodedProjectName of projectDirs) {
      const projectDir = join(projectsDir, encodedProjectName);

      try {
        const files = await readdir(projectDir);
        const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && isMainSessionFile(f));

        for (const file of jsonlFiles) {
          sessionFiles.push({
            filePath: join(projectDir, file),
            projectPath: decodeProjectPath(encodedProjectName),
            sessionId: getSessionIdFromFilename(file),
          });
        }
      } catch {
        // Skip directories we can't read
        continue;
      }
    }
  } catch (error) {
    console.error('Failed to read Claude projects directory:', error);
  }

  return sessionFiles;
}

/**
 * Scan all sessions and group by project
 */
export async function scanSessions(): Promise<Project[]> {
  const sessionFiles = await discoverSessionFiles();
  const projectMap = new Map<string, Session[]>();

  // Parse each session file
  for (const { filePath, projectPath, sessionId } of sessionFiles) {
    try {
      const session = await parseSessionFile(filePath, projectPath, sessionId);

      if (!projectMap.has(projectPath)) {
        projectMap.set(projectPath, []);
      }
      projectMap.get(projectPath)!.push(session);
    } catch {
      // Skip files that fail to parse
      continue;
    }
  }

  // Convert to Project array, sorted by most recent activity
  const projects: Project[] = [];

  for (const [path, sessions] of projectMap) {
    // Sort sessions by updatedAt (most recent first)
    sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    projects.push({
      path,
      shortPath: getShortPath(path),
      sessions,
      expanded: false,
    });
  }

  // Sort projects by most recent session
  projects.sort((a, b) => {
    const aLatest = a.sessions[0]?.updatedAt.getTime() ?? 0;
    const bLatest = b.sessions[0]?.updatedAt.getTime() ?? 0;
    return bLatest - aLatest;
  });

  // Expand the first project by default
  if (projects.length > 0) {
    projects[0].expanded = true;
  }

  return projects;
}
