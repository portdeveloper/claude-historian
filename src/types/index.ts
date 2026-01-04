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

// Raw types from .jsonl files
export interface RawSummaryLine {
  type: 'summary';
  summary: string;
  leafUuid: string;
}

export interface RawUserMessage {
  type: 'user';
  parentUuid: string | null;
  cwd: string;
  sessionId: string;
  gitBranch?: string;
  message: {
    role: 'user';
    content: string;
  };
  uuid: string;
  timestamp: string;
}

export interface RawAssistantMessage {
  type: 'assistant';
  parentUuid: string;
  message: {
    role: 'assistant';
    content: Array<{ type: string; text?: string; thinking?: string }>;
  };
  uuid: string;
  timestamp: string;
}

export type RawLine = RawSummaryLine | RawUserMessage | RawAssistantMessage | { type: string };
