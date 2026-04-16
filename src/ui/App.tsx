import { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import Fuse from 'fuse.js';
import { scanSessions } from '../services/scanner';
import { launchSession, deleteSession } from '../services/launcher';
import { parseSessionMessages, type PreviewMessage } from '../services/parser';
import { ProjectTree } from './ProjectTree';
import { StatusBar } from './StatusBar';
import { SearchInput } from './SearchInput';
import { PreviewModal } from './PreviewModal';
import type { Project, Session } from '../types';

interface SearchableSession extends Session {
  projectPath: string;
  projectShortPath: string;
}

interface FlatItem {
  type: 'project' | 'session' | 'missing-header';
  project?: Project;
  session?: Session;
  index: number;
}

const HEADER_LINES = 4; // Title + subtitle + padding
const FOOTER_LINES = 2; // Status bar

export function App({ skipPermissions = false }: { skipPermissions?: boolean } = {}) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'browse' | 'search' | 'confirm-delete' | 'confirm-bulk-delete' | 'preview'>('browse');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [markedSessions, setMarkedSessions] = useState<Set<string>>(new Set());
  const [showHelp, setShowHelp] = useState(false);
  const [previewSession, setPreviewSession] = useState<Session | null>(null);
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Keep refs for use in async handlers (avoids stale closures)
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const markedSessionsRef = useRef(markedSessions);
  markedSessionsRef.current = markedSessions;

  // Calculate visible height for the tree
  const terminalHeight = stdout?.rows || 24;
  const visibleHeight = Math.max(5, terminalHeight - HEADER_LINES - FOOTER_LINES - (mode === 'search' ? 2 : 0));

  // Load sessions on mount
  useEffect(() => {
    scanSessions()
      .then((p) => {
        setProjects(p);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Separate existing and missing projects (memoized to avoid re-filtering on every render)
  const filteredProjects = useMemo(
    () => filterProjects(projects, searchQuery),
    [projects, searchQuery]
  );
  const existingProjects = filteredProjects.filter(p => p.exists);
  const missingProjects = filteredProjects.filter(p => !p.exists);
  const missingSessionCount = missingProjects.reduce((sum, p) => sum + p.sessions.length, 0);

  // Build flat list of selectable items
  const flatItems: FlatItem[] = [];

  for (const project of existingProjects) {
    flatItems.push({ type: 'project', project, index: flatItems.length });

    if (project.expanded) {
      for (const session of project.sessions) {
        flatItems.push({ type: 'session', project, session, index: flatItems.length });
      }
    }
  }

  // Add missing projects section if any exist
  if (missingProjects.length > 0) {
    flatItems.push({ type: 'missing-header', index: flatItems.length });

    if (showMissing) {
      for (const project of missingProjects) {
        flatItems.push({ type: 'project', project, index: flatItems.length });

        if (project.expanded) {
          for (const session of project.sessions) {
            flatItems.push({ type: 'session', project, session, index: flatItems.length });
          }
        }
      }
    }
  }

  // Handle keyboard input
  useInput((input, key) => {
    // Dismiss error on any key press
    if (error) {
      setError(null);
      return;
    }

    // Handle delete confirmation mode
    if (mode === 'confirm-delete') {
      if (input === 'y' || input === 'Y') {
        if (sessionToDelete && !deleting) {
          setDeleting(true);

          deleteSession(sessionToDelete.filePath)
            .then((result) => {
              if (result.success) {
                // Remove session from state
                setProjects((prev) =>
                  prev.map((p) => ({
                    ...p,
                    sessions: p.sessions.filter((s) => s.id !== sessionToDelete.id),
                  })).filter((p) => p.sessions.length > 0)
                );
              } else {
                setError(`Failed to delete: ${result.error}`);
              }
            })
            .finally(() => {
              setDeleting(false);
              setSessionToDelete(null);
              setMode('browse');
            });
        }
        return;
      }
      if (input === 'n' || input === 'N' || key.escape) {
        if (!deleting) {
          setSessionToDelete(null);
          setMode('browse');
        }
        return;
      }
      return;
    }

    // Handle bulk delete confirmation mode
    if (mode === 'confirm-bulk-delete') {
      if (input === 'y' || input === 'Y') {
        const currentMarked = markedSessionsRef.current;
        if (currentMarked.size > 0 && !deleting) {
          setDeleting(true);

          // Get file paths for marked sessions (use refs to get latest state)
          const filePaths: { id: string; path: string }[] = [];
          for (const project of projectsRef.current) {
            for (const session of project.sessions) {
              if (currentMarked.has(session.id)) {
                filePaths.push({ id: session.id, path: session.filePath });
              }
            }
          }

          // Delete all marked sessions
          Promise.all(filePaths.map((f) => deleteSession(f.path)))
            .then((results) => {
              const successIds = new Set(
                results
                  .map((r, i) => (r.success ? filePaths[i]?.id : null))
                  .filter((id): id is string => id !== null)
              );
              const failCount = results.filter((r) => !r.success).length;

              // Remove successful deletions from state
              setProjects((prev) =>
                prev
                  .map((p) => ({
                    ...p,
                    sessions: p.sessions.filter((s) => !successIds.has(s.id)),
                  }))
                  .filter((p) => p.sessions.length > 0)
              );

              if (failCount > 0) {
                setError(`Failed to delete ${failCount} session(s)`);
              }
            })
            .finally(() => {
              setDeleting(false);
              setMarkedSessions(new Set());
              setMode('browse');
            });
        }
        return;
      }
      if (input === 'n' || input === 'N' || key.escape) {
        if (!deleting) {
          setMode('browse');
        }
        return;
      }
      return;
    }

    // Handle preview mode - close on any key
    if (mode === 'preview') {
      setPreviewSession(null);
      setPreviewMessages([]);
      setMode('browse');
      return;
    }

    if (mode === 'search') {
      if (key.escape) {
        setMode('browse');
        setSearchQuery('');
      }
      return;
    }

    // Browse mode
    if (input === 'q' || key.escape) {
      exit();
      return;
    }

    if (input === '/') {
      setMode('search');
      return;
    }

    // Delete - bulk if sessions are marked, otherwise single
    if (input === 'd' || input === 'D') {
      if (markedSessionsRef.current.size > 0) {
        // Bulk delete all marked sessions
        setMode('confirm-bulk-delete');
      } else {
        // Single delete current session
        const item = flatItems[selectedIndex];
        if (item?.type === 'session' && item.session) {
          setSessionToDelete(item.session);
          setMode('confirm-delete');
        }
      }
      return;
    }

    // Toggle mark on current session
    if (input === 'x') {
      const item = flatItems[selectedIndex];
      if (item?.type === 'session' && item.session) {
        setMarkedSessions((prev) => {
          const next = new Set(prev);
          if (next.has(item.session!.id)) {
            next.delete(item.session!.id);
          } else {
            next.add(item.session!.id);
          }
          return next;
        });
      }
      return;
    }

    // Mark/unmark all visible sessions
    if (input === 'X') {
      const visibleSessions = flatItems
        .filter((i) => i.type === 'session' && i.session)
        .map((i) => i.session!.id);

      if (visibleSessions.length === 0) return;

      // If all visible are marked, unmark all. Otherwise, mark all.
      const allMarked = visibleSessions.every((id) => markedSessions.has(id));
      setMarkedSessions((prev) => {
        const next = new Set(prev);
        for (const id of visibleSessions) {
          if (allMarked) {
            next.delete(id);
          } else {
            next.add(id);
          }
        }
        return next;
      });
      return;
    }

    // Preview session
    if (input === ' ' || input === 'p') {
      const item = flatItems[selectedIndex];
      if (item?.type === 'session' && item.session) {
        setPreviewSession(item.session);
        setPreviewLoading(true);
        setMode('preview');

        parseSessionMessages(item.session.filePath, 10)
          .then((msgs) => {
            setPreviewMessages(msgs);
          })
          .finally(() => {
            setPreviewLoading(false);
          });
      }
      return;
    }

    // Close help on any key
    if (showHelp) {
      setShowHelp(false);
      return;
    }

    // Help overlay toggle
    if (input === '?') {
      setShowHelp(true);
      return;
    }

    // Go to top
    if (input === 'g') {
      setSelectedIndex(0);
      setScrollOffset(0);
      return;
    }

    // Go to bottom
    if (input === 'G') {
      const lastIndex = flatItems.length - 1;
      setSelectedIndex(lastIndex);
      setScrollOffset(Math.max(0, lastIndex - visibleHeight + 1));
      return;
    }

    // Refresh
    if (input === 'r') {
      setLoading(true);
      scanSessions()
        .then((p) => {
          setProjects(p);
          setLoading(false);
          setSelectedIndex(0);
          setScrollOffset(0);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => {
        const newIndex = Math.max(0, i - 1);
        // Adjust scroll if selection goes above visible area
        if (newIndex < scrollOffset) {
          setScrollOffset(newIndex);
        }
        return newIndex;
      });
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((i) => {
        const newIndex = Math.min(flatItems.length - 1, i + 1);
        // Adjust scroll if selection goes below visible area
        if (newIndex >= scrollOffset + visibleHeight) {
          setScrollOffset(newIndex - visibleHeight + 1);
        }
        return newIndex;
      });
      return;
    }

    if (key.leftArrow) {
      const item = flatItems[selectedIndex];
      if (item?.type === 'missing-header' && showMissing) {
        setShowMissing(false);
      } else if (item?.type === 'project' && item.project?.expanded) {
        toggleProject(item.project.path, false);
      } else if (item?.type === 'session' && item.project) {
        // Move to parent project
        const projectIndex = flatItems.findIndex(
          (i) => i.type === 'project' && i.project?.path === item.project?.path
        );
        if (projectIndex !== -1) {
          setSelectedIndex(projectIndex);
        }
      }
      return;
    }

    if (key.rightArrow) {
      const item = flatItems[selectedIndex];
      if (item?.type === 'missing-header' && !showMissing) {
        setShowMissing(true);
      } else if (item?.type === 'project' && item.project && !item.project.expanded) {
        toggleProject(item.project.path, true);
      }
      return;
    }

    if (key.return) {
      const item = flatItems[selectedIndex];
      if (item?.type === 'missing-header') {
        setShowMissing(!showMissing);
      } else if (item?.type === 'project' && item.project) {
        toggleProject(item.project.path, !item.project.expanded);
      } else if (item?.type === 'session' && item.session && item.project) {
        if (!item.project.exists) {
          // Can't launch session for missing project directory
          setError(`Cannot resume: directory no longer exists\n${item.project.path}`);
          return;
        }
        // Launch Claude with this session
        exit();
        launchSession(item.session.id, item.project.path, skipPermissions);
      }
      return;
    }
  });

  function toggleProject(path: string, expanded: boolean) {
    setProjects((prev) =>
      prev.map((p) => (p.path === path ? { ...p, expanded } : p))
    );
  }

  function handleSearchChange(query: string) {
    setSearchQuery(query);
    setSelectedIndex(0);
  }

  function handleSearchSubmit() {
    setMode('browse');
  }

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text>Loading sessions...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">Error: {error}</Text>
        <Text dimColor>Press any key to continue</Text>
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">No Claude Code sessions found.</Text>
        <Text dimColor>Sessions are stored in ~/.claude/projects/</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" paddingX={1} paddingTop={1}>
        <Text bold color="cyan">Claude Historian</Text>
        <Text dimColor>Browse and resume your Claude Code sessions</Text>
      </Box>

      {mode === 'search' && (
        <Box paddingX={1} paddingY={1}>
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            onSubmit={handleSearchSubmit}
          />
        </Box>
      )}

      <Box flexDirection="column" paddingX={1} paddingY={1} overflow="hidden">
        <ProjectTree
          flatItems={flatItems}
          selectedIndex={selectedIndex}
          scrollOffset={scrollOffset}
          visibleHeight={visibleHeight}
          showMissing={showMissing}
          missingSessionCount={missingSessionCount}
          markedSessions={markedSessions}
        />
      </Box>

      {mode === 'confirm-delete' && sessionToDelete && (
        <Box paddingX={1} paddingY={1} flexDirection="column">
          {deleting ? (
            <Text color="yellow">Deleting...</Text>
          ) : (
            <>
              <Text color="yellow">Delete this session?</Text>
              <Text dimColor>"{sessionToDelete.summary}"</Text>
              <Text>
                <Text color="green">[y]</Text> Yes, delete
                <Text color="red">[n]</Text> No, cancel
              </Text>
            </>
          )}
        </Box>
      )}

      {mode === 'confirm-bulk-delete' && (
        <Box paddingX={1} paddingY={1} flexDirection="column">
          {deleting ? (
            <Text color="yellow">Deleting {markedSessions.size} sessions...</Text>
          ) : (
            <>
              <Text color="yellow">Delete {markedSessions.size} marked session{markedSessions.size === 1 ? '' : 's'}?</Text>
              <Text>
                <Text color="green">[y]</Text> Yes, delete all
                <Text color="red">[n]</Text> No, cancel
              </Text>
            </>
          )}
        </Box>
      )}

      {mode === 'preview' && previewSession && (
        <PreviewModal
          session={previewSession}
          messages={previewMessages}
          loading={previewLoading}
        />
      )}

      {showHelp && (
        <Box paddingX={1} paddingY={1} flexDirection="column" borderStyle="round" borderColor="cyan">
          <Text bold color="cyan">Keyboard Shortcuts</Text>
          <Text> </Text>
          <Text bold dimColor>Navigation</Text>
          <Text><Text color="yellow">↑/↓</Text>       Navigate up/down</Text>
          <Text><Text color="yellow">←/→</Text>       Collapse/expand project</Text>
          <Text><Text color="yellow">g/G</Text>       Go to top/bottom</Text>
          <Text><Text color="yellow">/</Text>         Search (fuzzy)</Text>
          <Text> </Text>
          <Text bold dimColor>Actions</Text>
          <Text><Text color="yellow">enter</Text>     Resume session</Text>
          <Text><Text color="yellow">space/p</Text>   Preview messages</Text>
          <Text><Text color="yellow">r</Text>         Refresh list</Text>
          <Text> </Text>
          <Text bold dimColor>Delete</Text>
          <Text><Text color="yellow">x</Text>         Mark/unmark session</Text>
          <Text><Text color="yellow">X</Text>         Mark/unmark all visible</Text>
          <Text><Text color="yellow">d</Text>         Delete (marked or current)</Text>
          <Text> </Text>
          <Text><Text color="yellow">q/esc</Text>     Quit</Text>
          <Text> </Text>
          <Text dimColor>Press any key to close</Text>
        </Box>
      )}

      <StatusBar mode={mode} markedCount={markedSessions.size} />
    </Box>
  );
}

function filterProjects(projects: Project[], query: string): Project[] {
  if (!query.trim()) {
    return projects;
  }

  // Build flat list of searchable sessions
  const searchableSessions: SearchableSession[] = projects.flatMap((project) =>
    project.sessions.map((session) => ({
      ...session,
      projectPath: project.path,
      projectShortPath: project.shortPath,
    }))
  );

  // Create Fuse instance for fuzzy search
  const fuse = new Fuse(searchableSessions, {
    keys: ['summary', 'gitBranch', 'projectShortPath'],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
  });

  // Search and get matching session IDs grouped by project
  const results = fuse.search(query);
  const matchingSessionsByProject = new Map<string, Set<string>>();

  for (const result of results) {
    const session = result.item;
    if (!matchingSessionsByProject.has(session.projectPath)) {
      matchingSessionsByProject.set(session.projectPath, new Set());
    }
    matchingSessionsByProject.get(session.projectPath)!.add(session.id);
  }

  // Filter projects to only include those with matching sessions
  return projects
    .map((project) => {
      const matchingIds = matchingSessionsByProject.get(project.path);
      if (!matchingIds || matchingIds.size === 0) {
        return null;
      }

      const matchingSessions = project.sessions.filter((s) => matchingIds.has(s.id));
      return { ...project, sessions: matchingSessions, expanded: true };
    })
    .filter((p): p is Project => p !== null);
}
