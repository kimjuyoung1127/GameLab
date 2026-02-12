"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileAudio,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { UploadJobStatus } from "@/types";
import { endpoints } from "@/lib/api/endpoints";

const ACCEPTED_FORMATS = [".wav", ".m4a", ".mp3"];
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

interface FileEntry {
  id: string;
  file: File;
  status: UploadJobStatus;
  progress: number;
  jobId?: string;
  error?: string;
}

interface ApiUploadResult {
  fileId?: string;
  file_id?: string;
  filename: string;
  status: UploadJobStatus;
  jobId?: string | null;
  job_id?: string | null;
  sessionId?: string | null;
  session_id?: string | null;
  progress?: number;
  error?: string | null;
}

interface ApiJobStatusResponse {
  jobId?: string;
  job_id?: string;
  sessionId?: string | null;
  session_id?: string | null;
  status: UploadJobStatus;
  progress?: number;
  error?: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function validateFile(file: File): string | null {
  const ext = getExtension(file.name);
  if (!ACCEPTED_FORMATS.includes(ext)) {
    return `Unsupported format (${ext}). Only .wav, .m4a, .mp3 are allowed.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is larger than 1GB (${formatBytes(file.size)}).`;
  }
  return null;
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const entries: FileEntry[] = Array.from(newFiles).map((file) => {
      const error = validateFile(file);
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        status: error ? "failed" : "idle",
        progress: 0,
        error: error ?? undefined,
      };
    });
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const pollJobStatus = useCallback(async (entryId: string, jobId: string) => {
    for (let i = 0; i < 6; i += 1) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const res = await fetch(endpoints.jobs.status(jobId));
        if (!res.ok) continue;
        const job = (await res.json()) as ApiJobStatusResponse;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === entryId
              ? {
                  ...f,
                  status: job.status,
                  progress: job.progress ?? f.progress,
                  error: job.error ?? undefined,
                }
              : f
          )
        );

        if (job.status === "done" || job.status === "failed") {
          return job;
        }
      } catch {
        // Keep current state and retry.
      }
    }
    return null;
  }, []);

  const handleUpload = useCallback(async () => {
    const validFiles = files.filter((f) => f.status !== "failed");
    if (validFiles.length === 0) return;

    setUploading(true);
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "failed" ? f : { ...f, status: "uploading", progress: 5, error: undefined }
      )
    );

    try {
      const formData = new FormData();
      validFiles.forEach((entry) => formData.append("files", entry.file));

      const res = await fetch(endpoints.upload.files, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `Upload failed (${res.status})`);
      }

      const uploaded = (await res.json()) as ApiUploadResult[];
      const sessionIdFromUpload =
        uploaded.find((r) => (r.sessionId ?? r.session_id))?.sessionId ??
        uploaded.find((r) => (r.sessionId ?? r.session_id))?.session_id ??
        null;

      setFiles((prev) => {
        let idx = 0;
        return prev.map((f) => {
          if (f.status === "failed") return f;

          const result = uploaded[idx];
          idx += 1;

          if (!result) {
            return { ...f, status: "failed", progress: 0, error: "No response returned for this file." };
          }

          return {
            ...f,
            status: result.status,
            progress: result.progress ?? (result.status === "failed" ? 0 : 100),
            jobId: (result.jobId ?? result.job_id) ?? undefined,
            error: result.error ?? undefined,
          };
        });
      });

      const pollTargets = uploaded
        .map((result, idx) => ({ result, entry: validFiles[idx] }))
        .filter((x) => (x.result.jobId ?? x.result.job_id) && (x.result.status === "queued" || x.result.status === "processing"));

      const polled = await Promise.all(
        pollTargets.map((x) => pollJobStatus(x.entry.id, (x.result.jobId ?? x.result.job_id) as string))
      );
      const sessionIdFromJobs =
        polled.find((p) => p && (p.sessionId ?? p.session_id))?.sessionId ??
        polled.find((p) => p && (p.sessionId ?? p.session_id))?.session_id ??
        null;

      const finalSessionId = sessionIdFromUpload ?? sessionIdFromJobs;
      if (finalSessionId) {
        router.push(`/labeling/${finalSessionId}`);
      }
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "failed"
            ? f
            : {
                ...f,
                status: "failed",
                progress: 0,
                error: "Cannot reach upload API. Check backend server and NEXT_PUBLIC_API_URL.",
              }
        )
      );
    } finally {
      setUploading(false);
    }
  }, [files, pollJobStatus, router]);

  const validCount = files.filter((f) => f.status !== "failed").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const allDone = validCount > 0 && doneCount === validCount && !uploading;

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-panel flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/overview")}
            className="p-1.5 rounded-lg hover:bg-panel-light transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <Upload className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-text">Upload Files</h1>
        </div>
        {files.length > 0 && !uploading && (
          <button
            onClick={clearAll}
            className="text-xs text-text-muted hover:text-danger transition-colors"
          >
            Clear All
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="bg-panel rounded-2xl border border-border p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary space-y-1">
            <p className="font-medium text-text">Supported formats</p>
            <p>
              <span className="text-accent font-medium">.wav</span> (recommended),{" "}
              <span className="text-accent font-medium">.m4a</span> (iPhone),{" "}
              <span className="text-accent font-medium">.mp3</span> (Android/messenger)
              {" "}&middot; max 1GB
            </p>
            <p className="text-text-muted text-xs">
              Files are converted on the server to wav/mono/16kHz before analysis.
            </p>
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-10 md:p-16 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-panel"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_FORMATS.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-text mb-1">Drag files here or click to select</p>
          <p className="text-xs text-text-muted">.wav, .m4a, .mp3 &middot; max 1GB &middot; multi-select supported</p>
        </div>

        {files.length > 0 && (
          <div className="bg-panel rounded-2xl border border-border divide-y divide-border">
            {files.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 md:px-6">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    entry.status === "failed"
                      ? "bg-danger/10"
                      : entry.status === "done"
                        ? "bg-accent/10"
                        : "bg-primary/10"
                  }`}
                >
                  {entry.status === "failed" ? (
                    <AlertCircle className="w-4 h-4 text-danger" />
                  ) : entry.status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  ) : (
                    <FileAudio className="w-4 h-4 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{entry.file.name}</p>
                  {entry.error ? (
                    <p className="text-xs text-danger">{entry.error}</p>
                  ) : (
                    <p className="text-xs text-text-muted">
                      {formatBytes(entry.file.size)} &middot; {getExtension(entry.file.name).replace(".", "").toUpperCase()}
                      {entry.status === "uploading" && ` · Uploading ${entry.progress}%`}
                      {entry.status === "processing" && " · Processing..."}
                      {entry.status === "queued" && " · Queued"}
                      {entry.status === "done" && " · Complete"}
                    </p>
                  )}

                  {(entry.status === "uploading" || entry.status === "processing") && (
                    <div className="mt-1.5 h-1 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${entry.progress}%` }} />
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {entry.status === "uploading" || entry.status === "processing" ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : entry.status === "done" ? (
                    <span className="text-xs text-accent font-semibold">Done</span>
                  ) : entry.status === "queued" ? (
                    <span className="text-xs text-warning font-semibold">Queued</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(entry.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-panel-light transition-colors"
                    >
                      {entry.status === "failed" ? (
                        <X className="w-4 h-4 text-danger" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-text-muted" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {files.some((f) => f.status === "failed") && (
          <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-danger">Some files failed to upload</p>
              <p className="text-text-secondary">
                Check file format/size, then retry.
                <br />
                If all files fail, verify backend is running and `NEXT_PUBLIC_API_URL` is set correctly.
              </p>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">
              {validCount} ready
              {doneCount > 0 && ` · ${doneCount} completed`}
            </p>
            {allDone ? (
              <button
                onClick={() => router.push("/sessions")}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Go to Sessions
              </button>
            ) : (
              <button
                onClick={handleUpload}
                disabled={uploading || validCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-light text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Start Upload ({validCount})
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
