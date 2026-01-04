import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  mode: 'browse' | 'search' | 'confirm-delete';
}

export function StatusBar({ mode }: Props) {
  if (mode === 'search') {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
        <Text dimColor>[enter confirm] [esc cancel]</Text>
      </Box>
    );
  }

  if (mode === 'confirm-delete') {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
        <Text dimColor>[y confirm] [n/esc cancel]</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
      <Text dimColor>
        [↑↓ move] [←→ expand] [enter select] [d delete] [r refresh] [/ search] [? help] [q quit]
      </Text>
    </Box>
  );
}
