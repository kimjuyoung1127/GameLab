export type SessionStatus = "pending" | "processing" | "completed";

export interface Session {
  id: string;
  name: string;
  deviceType: string;
  status: SessionStatus;
  fileCount: number;
  progress: number;
  score: number | null;
  createdAt: string;
}

export type FileStatus = "wip" | "pending" | "done";

export interface AudioFile {
  id: string;
  sessionId: string;
  filename: string;
  duration: string;
  sampleRate: string;
  status: FileStatus;
  audioUrl?: string;
}
