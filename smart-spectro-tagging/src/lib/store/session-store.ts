import { create } from "zustand";
import type { Session, AudioFile } from "@/types";

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  files: AudioFile[];
  currentFileId: string | null;
  setSessions: (sessions: Session[]) => void;
  setFiles: (files: AudioFile[]) => void;
  setCurrentSession: (session: Session) => void;
  setCurrentSessionById: (sessionId: string) => Session | null;
  setCurrentFile: (fileId: string) => void;
  filterSessions: (status: string) => Session[];
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  files: [],
  currentFileId: null,

  setSessions: (sessions) => set({ sessions }),
  setFiles: (files) => set({ files, currentFileId: files[0]?.id ?? null }),

  setCurrentSession: (session) =>
    set({
      currentSession: session,
      files: [],
      currentFileId: null,
    }),

  setCurrentSessionById: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId) ?? null;
    if (!session) return null;

    set({
      currentSession: session,
      files: [],
      currentFileId: null,
    });
    return session;
  },

  setCurrentFile: (fileId) => set({ currentFileId: fileId }),

  filterSessions: (status) => {
    const { sessions } = get();
    if (status === "all") return sessions;
    return sessions.filter((s) => s.status === status);
  },
}));
