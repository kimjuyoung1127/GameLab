/** 대시보드 에러 바운더리: Sidebar 유지, 메인 영역에 에러 UI 표시. */
"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import styles from "./styles/error.module.css";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className={styles.c001}>
      <div className={styles.c002}>
        <div className={styles.c003}>
          <AlertTriangle className={styles.c004} />
        </div>
        <h2 className={styles.c005}>
          Something went wrong
        </h2>
        <p className={styles.c006}>
          {error.message || "An unexpected error occurred in this page."}
        </p>
        <button
          onClick={reset}
          className={styles.c007}
        >
          <RotateCcw className={styles.c008} />
          Try again
        </button>
      </div>
    </div>
  );
}
