/** Top header for labeling workspace with mode and score summary. */
import { AudioLines } from "lucide-react";
import type { LabelingMode } from "@/types";

type LabelingHeaderProps = {
  mode: LabelingMode;
  score: number;
  streak: number;
  sessionError: string | null;
  suggestionError: string | null;
  styles: Record<string, string>;
};

export default function LabelingHeader({
  mode,
  score,
  streak,
  sessionError,
  suggestionError,
  styles,
}: LabelingHeaderProps) {
  return (
    <>
      <header className={styles.c002}>
        <div className={styles.c003}>
          <div className={styles.c004}>
            <div className={styles.c005}>
              <AudioLines className={styles.c006} />
            </div>
            <span className={styles.c007}>Smart Spectro-Tagging</span>
          </div>

          <div className={styles.c008} />

          <span className={styles.c009}>
            Project: <span className={styles.c010}>Turbine_Vibration_X42</span>
          </span>

          <span className={styles.c011}>v2.4.0</span>
        </div>

        <div className={styles.c012}>
          <div
            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
              mode === "review" ? "bg-accent/15 text-accent" : "bg-warning/15 text-warning"
            }`}
          >
            {mode} mode
          </div>

          <div className={styles.c013} />

          <div className={styles.c014}>
            <span className={styles.c015}>&#127942;</span>
            <span className={styles.c016}>SCORE</span>
            <span className={styles.c017}>{score.toLocaleString()}</span>
          </div>

          <div className={styles.c008} />

          <div className={styles.c018}>
            <span className={styles.c015}>&#128293;</span>
            <span>STREAK</span>
            <span className={styles.c017}>{streak} Days</span>
          </div>

          <div className={styles.c008} />

          <div className={styles.c019}>AR</div>
        </div>
      </header>
      {(sessionError || suggestionError) && (
        <div className={styles.c020}>{sessionError ?? suggestionError}</div>
      )}
    </>
  );
}
