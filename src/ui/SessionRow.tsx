import React from 'react';
import { Box, Text } from 'ink';
import { formatRelativeTime } from '../utils/time';
import type { Session } from '../types';

interface Props {
  session: Session;
  isSelected: boolean;
  isLast: boolean;
}

export function SessionRow({ session, isSelected, isLast }: Props) {
  const prefix = isLast ? '└──' : '├──';
  const timeStr = formatRelativeTime(session.updatedAt);
  const msgCount = `${session.messageCount} msgs`;

  // Truncate summary to fit
  const maxSummaryLen = 35;
  let summary = session.summary.replace(/\n/g, ' ').trim();
  if (summary.length > maxSummaryLen) {
    summary = summary.slice(0, maxSummaryLen - 1) + '…';
  }

  return (
    <Box flexShrink={0}>
      <Text dimColor wrap="truncate">    {prefix} </Text>
      <Text
        backgroundColor={isSelected ? 'blue' : undefined}
        color={isSelected ? 'white' : undefined}
        wrap="truncate"
      >
        {summary}
      </Text>
      {session.gitBranch && (
        <Text color="magenta" dimColor={!isSelected} wrap="truncate"> [{session.gitBranch}]</Text>
      )}
      <Text dimColor wrap="truncate">  {timeStr}  {msgCount}</Text>
    </Box>
  );
}
