import React from 'react';
import { Box, Text } from 'ink';
import type { Project } from '../types';

interface Props {
  project: Project;
  isSelected: boolean;
}

export function ProjectRow({ project, isSelected }: Props) {
  const prefix = project.expanded ? '▼' : '▶';
  const sessionCount = project.sessions.length;
  const countText = `(${sessionCount} session${sessionCount !== 1 ? 's' : ''})`;

  return (
    <Box>
      <Text
        backgroundColor={isSelected ? 'blue' : undefined}
        color={isSelected ? 'white' : 'yellow'}
        bold
      >
        {prefix} {project.shortPath}
      </Text>
      <Text dimColor> {countText}</Text>
    </Box>
  );
}
