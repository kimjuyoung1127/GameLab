import { create } from "zustand";
import type { Session, AudioFile } from "@/types";
import { mockSessions, mockAudioFiles } from "@/lib/mock/data";

interface CreateSessionInput {
  name: string;
  deviceType?: string;
  fileCount?: number;
}

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  files: AudioFile[];
  currentFileId: string | null;
  setCurrentSession: (session: Session) => void;
  setCurrentSessionById: (sessionId: string) => Session | null;
  setCurrentFile: (fileId: string) => void;
  createSession: (input: CreateSessionInput) => Session;
  filterSessions: (status: string) => Session[];
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: mockSessions,
  currentSession: null,
  files: [],
  currentFileId: null,

  setCurrentSession: (session) =>
    set({
      currentSession: session,
      files: mockAudioFiles.filter((f) => f.sessionId === session.id),
      currentFileId: mockAudioFiles.find((f) => f.sessionId === session.id)?.id ?? null,
    }),

  setCurrentSessionById: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId) ?? null;
    if (!session) return null;

    set({
      currentSession: session,
      files: mockAudioFiles.filter((f) => f.sessionId === session.id),
      currentFileId: mockAudioFiles.find((f) => f.sessionId === session.id)?.id ?? null,
    });
    return session;
  },

  setCurrentFile: (fileId) => set({ currentFileId: fileId }),

  createSession: (input) => {
    const { sessions } = get();
    const nextNumber =
      sessions
        .map((s) => Number.parseInt(s.id.replace("SES-", ""), 10))
        .filter((n) => Number.isFinite(n))
        .reduce((max, n) => Math.max(max, n), 0) + 1;

    const newSession: Session = {
      id: `SES-${nextNumber}`,
      name: input.name,
      deviceType: input.deviceType ?? "Industrial Sensor",
      status: "pending",
      fileCount: input.fileCount ?? 0,
      progress: 0,
      score: null,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    set({
      sessions: [newSession, ...sessions],
      currentSession: newSession,
      files: [],
      currentFileId: null,
    });

    return newSession;
  },

  filterSessions: (status) => {
    const { sessions } = get();
    if (status === "all") return sessions;
    return sessions.filter((s) => s.status === status);
  },
}));
