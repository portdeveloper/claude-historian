import { Box, Text } from 'ink';
import type { PreviewMessage } from '../services/parser';
import type { Session } from '../types';

interface Props {
  session: Session;
  messages: PreviewMessage[];
  loading: boolean;
}

export function PreviewModal({ session, messages, loading }: Props) {
  const maxContentLen = 200;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      paddingY={1}
    >
      <Text bold color="cyan">
        Preview: {session.summary.slice(0, 50)}
        {session.summary.length > 50 ? '…' : ''}
      </Text>
      <Text dimColor>
        {session.gitBranch ? `[${session.gitBranch}] ` : ''}
        {session.messageCount} messages
      </Text>
      <Text> </Text>

      {loading ? (
        <Text dimColor>Loading messages...</Text>
      ) : messages.length === 0 ? (
        <Text dimColor>No messages found</Text>
      ) : (
        messages.slice(0, 6).map((msg, i) => {
          let content = msg.content.replace(/\n/g, ' ').trim();
          if (content.length > maxContentLen) {
            content = content.slice(0, maxContentLen - 1) + '…';
          }

          return (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Text color={msg.role === 'user' ? 'cyan' : 'white'} bold>
                {msg.role === 'user' ? '› You' : '› Claude'}
              </Text>
              <Text wrap="truncate">  {content}</Text>
            </Box>
          );
        })
      )}

      <Text> </Text>
      <Text dimColor>Press any key to close</Text>
    </Box>
  );
}
