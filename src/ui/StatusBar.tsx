import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  mode: 'browse' | 'search';
}

export function StatusBar({ mode }: Props) {
  if (mode === 'search') {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
        <Text dimColor>[enter confirm] [esc cancel]</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
      <Text dimColor>
        [↑↓ navigate] [←→ expand/collapse] [enter select] [/ search] [q quit]
      </Text>
    </Box>
  );
}
