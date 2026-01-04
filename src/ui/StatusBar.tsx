import { Box, Text } from 'ink';

interface Props {
  mode: 'browse' | 'search' | 'confirm-delete' | 'confirm-bulk-delete' | 'preview';
  markedCount?: number;
}

export function StatusBar({ mode, markedCount = 0 }: Props) {
  if (mode === 'search') {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
        <Text dimColor>[enter confirm] [esc cancel]</Text>
      </Box>
    );
  }

  if (mode === 'confirm-delete' || mode === 'confirm-bulk-delete') {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
        <Text dimColor>[y confirm] [n/esc cancel]</Text>
      </Box>
    );
  }

  if (mode === 'preview') {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
        <Text dimColor>[any key to close]</Text>
      </Box>
    );
  }

  const markedText = markedCount > 0 ? `[${markedCount} marked] ` : '';

  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
      <Text dimColor>
        {markedText}[↑↓ move] [x mark] [d delete] [/ search] [? help] [q quit]
      </Text>
    </Box>
  );
}
