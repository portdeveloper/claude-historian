import React from 'react';
import { Box, Text } from 'ink';
import { ProjectRow } from './ProjectRow';
import { SessionRow } from './SessionRow';
import type { Project, Session } from '../types';

interface FlatItem {
  type: 'project' | 'session';
  project: Project;
  session?: Session;
  index: number;
}

interface Props {
  projects: Project[];
  flatItems: FlatItem[];
  selectedIndex: number;
}

export function ProjectTree({ projects, flatItems, selectedIndex }: Props) {
  return (
    <Box flexDirection="column">
      {flatItems.map((item, idx) => {
        if (item.type === 'project') {
          return (
            <ProjectRow
              key={`project-${item.project.path}`}
              project={item.project}
              isSelected={item.index === selectedIndex}
            />
          );
        }

        if (item.type === 'session' && item.session) {
          const sessionIndex = item.project.sessions.indexOf(item.session);
          const isLast = sessionIndex === item.project.sessions.length - 1;

          return (
            <SessionRow
              key={`session-${item.session.id}`}
              session={item.session}
              isSelected={item.index === selectedIndex}
              isLast={isLast}
            />
          );
        }

        return null;
      })}

      {flatItems.length === 0 && (
        <Text dimColor>No matching sessions found</Text>
      )}
    </Box>
  );
}
