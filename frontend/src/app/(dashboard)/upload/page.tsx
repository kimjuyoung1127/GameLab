/** 업로드 페이지: 드래그&드롭 멀티파일 업로드, 잡 폴링, 진행 상태 표시. */
"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { useUploadStore } from "@/lib/store/upload-store";
import { useUIStore } from "@/lib/store/ui-store";
import styles from "./styles/page.module.css";

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function validateFile(
  file: File,
  t: (key: string, params?: Record<string, string>) => string,
): string | null {
  const ext = getExtension(file.name);
  if (!ACCEPTED_FORMATS.includes(ext)) {
    return t("errorUnsupported", { ext });
  }
  if (file.size > MAX_FILE_SIZE) {
    return t("errorTooLarge", { size: formatBytes(file.size) });
  }
  return null;
}

export default function UploadPage() {
  const router = useRouter();
  const t = useTranslations("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const entries: FileEntry[] = Array.from(newFiles).map((file) => {
      const error = validateFile(file, t);
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        status: error ? "failed" : "idle",
        progress: 0,
        error: error ?? undefined,
      };
    });
    setFiles((prev) => [...prev, ...entries]);
  }, [t]);

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

  const addJobs = useUploadStore((s) => s.addJobs);
  const { showToast } = useUIStore();

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
      const sessionId =
        uploaded.find((r) => (r.sessionId ?? r.session_id))?.sessionId ??
        uploaded.find((r) => (r.sessionId ?? r.session_id))?.session_id ??
        "";

      // Register active jobs in global store for background polling
      const jobEntries = uploaded
        .filter((r) => (r.jobId ?? r.job_id))
        .map((r, idx) => ({
          jobId: ((r.jobId ?? r.job_id) as string),
          fileId: (r.fileId ?? r.file_id) ?? validFiles[idx]?.id ?? "",
          filename: r.filename,
          sessionId: (r.sessionId ?? r.session_id) ?? sessionId,
          status: r.status,
          progress: r.progress ?? 0,
          error: r.error ?? undefined,
        }));

      if (jobEntries.length > 0) {
        addJobs(jobEntries);
      }

      // Clear file list and show background message
      setFiles([]);
      showToast(t("backgroundMsg"));
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "failed"
            ? f
            : {
                ...f,
                status: "failed",
                progress: 0,
                error: t("errorApiFailed"),
              }
        )
      );
    } finally {
      setUploading(false);
    }
  }, [files, addJobs, showToast, t]);

  const validCount = files.filter((f) => f.status !== "failed").length;

  return (
    <div className={styles.c001}>
      <header className={styles.c002}>
        <div className={styles.c003}>
          <button
            onClick={() => router.push("/overview")}
            className={styles.c004}
            aria-label={t("backAria")}
          >
            <ArrowLeft className={styles.c005} />
          </button>
          <Upload className={styles.c006} />
          <h1 className={styles.c007}>{t("title")}</h1>
        </div>
        {files.length > 0 && !uploading && (
          <button
            onClick={clearAll}
            className={styles.c008}
          >
            {t("clearAll")}
          </button>
        )}
      </header>

      <div className={styles.c009}>
        <div className={styles.c010}>
          <AlertCircle className={styles.c011} />
          <div className={styles.c012}>
            <p className={styles.c013}>{t("supportedFormats")}</p>
            <p>
              <span className={styles.c014}>.wav</span> ({t("recommended")}),{" "}
              <span className={styles.c014}>.m4a</span> ({t("iphone")}),{" "}
              <span className={styles.c014}>.mp3</span> ({t("androidMessenger")})
              {" "}&middot; {t("maxSize")}
            </p>
            <p className={styles.c015}>
              {t("conversionNote")}
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
            className={styles.c016}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className={styles.c017}>
            <Upload className={styles.c018} />
          </div>
          <p className={styles.c019}>{t("dropzoneHint")}</p>
          <p className={styles.c020}>{t("dropzoneSubtext")}</p>
        </div>

        {files.length > 0 && (
          <div className={styles.c021}>
            {files.map((entry) => (
              <div key={entry.id} className={styles.c022}>
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
                    <AlertCircle className={styles.c023} />
                  ) : entry.status === "done" ? (
                    <CheckCircle2 className={styles.c024} />
                  ) : (
                    <FileAudio className={styles.c025} />
                  )}
                </div>

                <div className={styles.c026}>
                  <p className={styles.c027}>{entry.file.name}</p>
                  {entry.error ? (
                    <p className={styles.c028}>{entry.error}</p>
                  ) : (
                    <p className={styles.c020}>
                      {formatBytes(entry.file.size)} &middot; {getExtension(entry.file.name).replace(".", "").toUpperCase()}
                      {entry.status === "uploading" && ` · ${t("statusUploading", { progress: String(entry.progress) })}`}
                      {entry.status === "processing" && ` · ${t("statusProcessing")}`}
                      {entry.status === "queued" && ` · ${t("statusQueued")}`}
                      {entry.status === "done" && ` · ${t("statusComplete")}`}
                    </p>
                  )}

                  {(entry.status === "uploading" || entry.status === "processing") && (
                    <div className={styles.c029}>
                      <div className={styles.c030} style={{ width: `${entry.progress}%` }} />
                    </div>
                  )}
                </div>

                <div className={styles.c031}>
                  {entry.status === "uploading" || entry.status === "processing" ? (
                    <Loader2 className={styles.c032} />
                  ) : entry.status === "done" ? (
                    <span className={styles.c033}>{t("statusDone")}</span>
                  ) : entry.status === "queued" ? (
                    <span className={styles.c034}>{t("statusQueued")}</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(entry.id);
                      }}
                      className={styles.c004}
                    >
                      {entry.status === "failed" ? (
                        <X className={styles.c023} />
                      ) : (
                        <Trash2 className={styles.c035} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {files.some((f) => f.status === "failed") && (
          <div className={styles.c036}>
            <AlertCircle className={styles.c037} />
            <div className={styles.c038}>
              <p className={styles.c039}>{t("errorSectionTitle")}</p>
              <p className={styles.c040}>
                {t("errorSectionHint")}
              </p>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className={styles.c041}>
            <p className={styles.c020}>
              {validCount} {t("readyCount")}
            </p>
            <button
              onClick={handleUpload}
              disabled={uploading || validCount === 0}
              className={styles.c044}
            >
              {uploading ? (
                <>
                  <Loader2 className={styles.c045} />
                  {t("uploading")}
                </>
              ) : (
                <>
                  <Upload className={styles.c043} />
                  {t("startUpload", { count: String(validCount) })}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
