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
  const maxSummaryLen = 40;
  let summary = session.summary.replace(/\n/g, ' ').trim();
  if (summary.length > maxSummaryLen) {
    summary = summary.slice(0, maxSummaryLen - 1) + '…';
  }

  return (
    <Box>
      <Text dimColor>    {prefix} </Text>
      <Text
        backgroundColor={isSelected ? 'blue' : undefined}
        color={isSelected ? 'white' : undefined}
      >
        {summary}
      </Text>
      <Text dimColor>  {timeStr}  {msgCount}</Text>
    </Box>
  );
}
