import { z } from 'zod';

export interface Session {
  id: string;
  filePath: string;
  projectPath: string;
  shortPath: string;
  summary: string;
  updatedAt: Date;
  messageCount: number;
  gitBranch?: string;
}

export interface Project {
  path: string;
  shortPath: string;
  sessions: Session[];
  expanded: boolean;
  exists: boolean; // Whether the project directory still exists
}

export interface AppState {
  projects: Project[];
  selectedIndex: number;
  searchQuery: string;
  mode: 'browse' | 'search';
  loading: boolean;
  error?: string;
}

// Zod schemas for .jsonl files
export const RawSummaryLineSchema = z.object({
  type: z.literal('summary'),
  summary: z.string(),
  leafUuid: z.string(),
});

export const RawUserMessageSchema = z.object({
  type: z.literal('user'),
  parentUuid: z.string().nullable(),
  cwd: z.string(),
  sessionId: z.string(),
  gitBranch: z.string().optional(),
  message: z.object({
    role: z.literal('user'),
    content: z.string(),
  }),
  uuid: z.string(),
  timestamp: z.string(),
});

export const RawAssistantMessageSchema = z.object({
  type: z.literal('assistant'),
  parentUuid: z.string(),
  message: z.object({
    role: z.literal('assistant'),
    content: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
      thinking: z.string().optional(),
    })),
  }),
  uuid: z.string(),
  timestamp: z.string(),
});

export const RawLineSchema = z.discriminatedUnion('type', [
  RawSummaryLineSchema,
  RawUserMessageSchema,
  RawAssistantMessageSchema,
]);

// Inferred types from schemas
export type RawSummaryLine = z.infer<typeof RawSummaryLineSchema>;
export type RawUserMessage = z.infer<typeof RawUserMessageSchema>;
export type RawAssistantMessage = z.infer<typeof RawAssistantMessageSchema>;
export type RawLine = z.infer<typeof RawLineSchema>;
