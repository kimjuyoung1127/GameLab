export type UploadJobStatus = "idle" | "uploading" | "queued" | "processing" | "done" | "failed";

export interface UploadResult {
  fileId: string;
  filename: string;
  status: UploadJobStatus;
  progress: number;
  sessionId?: string;
  error?: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: UploadJobStatus;
  progress: number;
  result?: { sessionId: string; fileCount: number };
  error?: string;
}
