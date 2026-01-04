import { Box, Text } from 'ink';
import { ProjectRow } from './ProjectRow';
import { SessionRow } from './SessionRow';
import type { Project, Session } from '../types';

interface FlatItem {
  type: 'project' | 'session' | 'missing-header';
  project?: Project;
  session?: Session;
  index: number;
}

interface Props {
  flatItems: FlatItem[];
  selectedIndex: number;
  scrollOffset: number;
  visibleHeight: number;
  showMissing: boolean;
  missingSessionCount: number;
}

export function ProjectTree({ flatItems, selectedIndex, scrollOffset, visibleHeight, showMissing, missingSessionCount }: Props) {
  // Only render visible items
  const visibleItems = flatItems.slice(scrollOffset, scrollOffset + visibleHeight);

  return (
    <Box flexDirection="column">
      {visibleItems.map((item) => {
        if (item.type === 'missing-header') {
          const prefix = showMissing ? '▼' : '▶';
          const isSelected = item.index === selectedIndex;
          return (
            <Box key={`item-${item.index}`} flexShrink={0}>
              <Text
                backgroundColor={isSelected ? 'blue' : undefined}
                color={isSelected ? 'white' : 'gray'}
                dimColor={!isSelected}
                wrap="truncate"
              >
                {prefix} Sessions from deleted folders ({missingSessionCount})
              </Text>
            </Box>
          );
        }

        if (item.type === 'project' && item.project) {
          return (
            <ProjectRow
              key={`item-${item.index}`}
              project={item.project}
              isSelected={item.index === selectedIndex}
            />
          );
        }

        if (item.type === 'session' && item.session && item.project) {
          const sessionIndex = item.project.sessions.indexOf(item.session);
          const isLast = sessionIndex === item.project.sessions.length - 1;

          return (
            <SessionRow
              key={`item-${item.index}`}
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
