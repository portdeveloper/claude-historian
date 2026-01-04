import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { scanSessions } from '../services/scanner';
import { launchSession } from '../services/launcher';
import { ProjectTree } from './ProjectTree';
import { StatusBar } from './StatusBar';
import { SearchInput } from './SearchInput';
import type { Project, Session } from '../types';

interface FlatItem {
  type: 'project' | 'session' | 'missing-header';
  project?: Project;
  session?: Session;
  index: number;
}

const HEADER_LINES = 4; // Title + subtitle + padding
const FOOTER_LINES = 2; // Status bar

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'browse' | 'search'>('browse');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);

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

  // Separate existing and missing projects
  const filteredProjects = filterProjects(projects, searchQuery);
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
        launchSession(item.session.id, item.project.path);
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
          projects={existingProjects}
          flatItems={flatItems}
          selectedIndex={selectedIndex}
          scrollOffset={scrollOffset}
          visibleHeight={visibleHeight}
          showMissing={showMissing}
          missingSessionCount={missingSessionCount}
        />
      </Box>

      <StatusBar mode={mode} />
    </Box>
  );
}

function filterProjects(projects: Project[], query: string): Project[] {
  if (!query.trim()) {
    return projects;
  }

  const lowerQuery = query.toLowerCase();

  return projects
    .map((project) => {
      // Check if project path matches
      const projectMatches = project.shortPath.toLowerCase().includes(lowerQuery);

      // Filter sessions that match
      const matchingSessions = project.sessions.filter(
        (s) =>
          s.summary.toLowerCase().includes(lowerQuery) ||
          s.gitBranch?.toLowerCase().includes(lowerQuery)
      );

      if (projectMatches) {
        // If project matches, show all sessions
        return { ...project, expanded: true };
      }

      if (matchingSessions.length > 0) {
        // If sessions match, show only matching sessions
        return { ...project, sessions: matchingSessions, expanded: true };
      }

      return null;
    })
    .filter((p): p is Project => p !== null);
}
