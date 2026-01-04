import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function SearchInput({ value, onChange, onSubmit }: Props) {
  return (
    <Box>
      <Text color="cyan">/ </Text>
      <TextInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder="Search projects and sessions..."
      />
    </Box>
  );
}
