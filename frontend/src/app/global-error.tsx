/** 글로벌 에러 바운더리: 루트 레이아웃 에러 캐치. */
"use client";
import styles from "./styles/global-error.module.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className={styles.c002}>
        <div className={styles.c003}>
          <div className={styles.c004}>
            <div className={styles.c005}>
              <span className={styles.c006}>!</span>
            </div>
            <h2 className={styles.c007}>Something went wrong</h2>
            <p className={styles.c008}>
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={reset}
              className={styles.c009}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
