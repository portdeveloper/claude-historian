import { readdir, access } from 'fs/promises';
import { join } from 'path';
import {
  getClaudeProjectsDir,
  decodeProjectPath,
  getShortPath,
  isMainSessionFile,
  getSessionIdFromFilename
} from '../utils/paths';
import { debug } from '../utils/log';
import { parseSessionFile } from './parser';
import type { Project, Session } from '../types';

/**
 * Check if a directory exists
 */
async function directoryExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

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
      } catch (err) {
        debug(`Skipping unreadable directory: ${projectDir}`, err);
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

  // Parse all session files in parallel
  const parseResults = await Promise.all(
    sessionFiles.map(async ({ filePath, projectPath: fallbackPath, sessionId }) => {
      try {
        return await parseSessionFile(filePath, fallbackPath, sessionId);
      } catch (err) {
        debug(`Failed to parse session file: ${filePath}`, err);
        return null;
      }
    })
  );

  // Group sessions by project
  for (const session of parseResults) {
    if (!session || session.messageCount === 0) continue;

    const actualPath = session.projectPath;
    if (!projectMap.has(actualPath)) {
      projectMap.set(actualPath, []);
    }
    projectMap.get(actualPath)!.push(session);
  }

  // Batch check directory existence for all projects
  const paths = Array.from(projectMap.keys());
  const existsResults = await Promise.all(paths.map(directoryExists));
  const existsMap = new Map(paths.map((p, i) => [p, existsResults[i]]));

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
      exists: existsMap.get(path) ?? false,
    });
  }

  // Sort projects by most recent session
  projects.sort((a, b) => {
    const aLatest = a.sessions[0]?.updatedAt.getTime() ?? 0;
    const bLatest = b.sessions[0]?.updatedAt.getTime() ?? 0;
    return bLatest - aLatest;
  });

  // Expand the first project by default
  const firstProject = projects[0];
  if (firstProject) {
    firstProject.expanded = true;
  }

  return projects;
}
