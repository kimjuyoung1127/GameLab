/** 세션 도메인 타입: Session, AudioFile 인터페이스. */
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
  userId?: string | null;
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
