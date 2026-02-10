import { create } from "zustand";
import type { Session, AudioFile } from "@/types";
import { mockSessions, mockAudioFiles } from "@/lib/mock/data";

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  files: AudioFile[];
  currentFileId: string | null;
  setCurrentSession: (session: Session) => void;
  setCurrentFile: (fileId: string) => void;
  filterSessions: (status: string) => Session[];
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: mockSessions,
  currentSession: null,
  files: mockAudioFiles,
  currentFileId: null,

  setCurrentSession: (session) =>
    set({
      currentSession: session,
      files: mockAudioFiles.filter((f) => f.sessionId === session.id),
      currentFileId: mockAudioFiles.find((f) => f.sessionId === session.id)?.id ?? null,
    }),

  setCurrentFile: (fileId) => set({ currentFileId: fileId }),

  filterSessions: (status) => {
    const { sessions } = get();
    if (status === "all") return sessions;
    return sessions.filter((s) => s.status === status);
  },
}));
