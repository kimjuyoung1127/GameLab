/** Session/file bootstrap hook for labeling page. */
"use client";

import { useEffect, useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { useSessionStore } from "@/lib/store/session-store";
import type { AudioFile, Session } from "@/types";

type UseLabelingSessionDataParams = {
  sessionId: string;
  onSessionMissing: () => void;
};

export function useLabelingSessionData({ sessionId, onSessionMissing }: UseLabelingSessionDataParams) {
  const {
    files,
    currentFileId,
    setCurrentFile,
    setCurrentSessionById,
    setSessions,
    setFiles,
  } = useSessionStore();
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setSessionError(null);

    const loadSessionData = async () => {
      try {
        const [sessionsRes, filesRes] = await Promise.all([
          fetch(endpoints.sessions.list),
          fetch(endpoints.sessions.files(sessionId)),
        ]);

        if (!sessionsRes.ok) throw new Error("Failed to load sessions");
        if (!filesRes.ok) throw new Error("Failed to load session files");

        const sessionsData = (await sessionsRes.json()) as Session[];
        const filesData = (await filesRes.json()) as AudioFile[];

        setSessions(sessionsData);
        const targetSession = setCurrentSessionById(sessionId);
        setFiles(filesData);

        if (!targetSession && filesData.length === 0) onSessionMissing();
      } catch (err) {
        setSessionError((err as Error).message || "Failed to load labeling data");
      }
    };

    void loadSessionData();
  }, [onSessionMissing, sessionId, setCurrentSessionById, setFiles, setSessions]);

  return {
    files,
    currentFileId,
    setCurrentFile,
    sessionError,
  };
}
