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

  // Truncate path if too long
  const maxPathLen = 30;
  let displayPath = project.shortPath;
  if (displayPath.length > maxPathLen) {
    displayPath = '…' + displayPath.slice(-maxPathLen + 1);
  }

  // Missing projects are shown dimmed (they're under the "deleted folders" section)
  const isMissing = !project.exists;

  return (
    <Box flexShrink={0}>
      <Text
        backgroundColor={isSelected ? 'blue' : undefined}
        color={isSelected ? 'white' : isMissing ? 'gray' : 'yellow'}
        bold={!isMissing}
        dimColor={isMissing && !isSelected}
        wrap="truncate"
      >
        {prefix} {displayPath}
      </Text>
      <Text dimColor wrap="truncate">  {countText}</Text>
    </Box>
  );
}
