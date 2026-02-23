/** Suggestion card for review/edit/empty states in the right panel. */
import { Check, Sparkles, Wrench, X } from "lucide-react";
import type { AISuggestion } from "@/types";

type SuggestionCardProps = {
  mode: "review" | "edit";
  activeSuggestion: AISuggestion | null;
  rejectedSuggestion: AISuggestion | null;
  confirmedCount: number;
  pendingCount: number;
  totalCount: number;
  onConfirm: () => void;
  onReject: () => void;
  onApplyFix: () => void;
  styles: Record<string, string>;
};

export default function SuggestionCard({
  mode,
  activeSuggestion,
  rejectedSuggestion,
  confirmedCount,
  pendingCount,
  totalCount,
  onConfirm,
  onReject,
  onApplyFix,
  styles,
}: SuggestionCardProps) {
  if (mode === "review" && activeSuggestion) {
    return (
      <div className={styles.c106}>
        <div className={styles.c107}>
          <div className={styles.c108}>
            <div>
              <h3 className={styles.c109}>{activeSuggestion.label}</h3>
              <p className={styles.c110}>AI Detected Anomaly</p>
            </div>
            <div className={styles.c111}>
              <span className={styles.c112}>{activeSuggestion.confidence}%</span>
            </div>
          </div>

          <div className={styles.c113}>
            <div className={styles.c043} style={{ width: `${activeSuggestion.confidence}%` }} />
          </div>

          <p className={styles.c114}>{activeSuggestion.description}</p>

          <div className={styles.c115}>
            <button onClick={onReject} className={styles.c116}>
              <X className={styles.c053} />
              Reject
              <kbd className={styles.c117}>X</kbd>
            </button>
            <button onClick={onConfirm} className={styles.c118}>
              <Check className={styles.c053} />
              Confirm
              <kbd className={styles.c119}>O</kbd>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "edit" && rejectedSuggestion) {
    return (
      <div className={styles.c106}>
        <div className={styles.c120}>
          <div className={styles.c121}>
            <Wrench className={styles.c122} />
            <h3 className={styles.c123}>Edit Mode</h3>
          </div>

          <p className={styles.c124}>
            Rejected: <span className={styles.c010}>{rejectedSuggestion.label}</span>
          </p>
          <p className={styles.c125}>
            Draw the correct annotation region on the spectrogram, then apply the fix.
          </p>

          <button onClick={onApplyFix} className={styles.c126}>
            <Check className={styles.c053} />
            Apply Fix (+20 pts)
            <kbd className={styles.c127}>F</kbd>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "review" && !activeSuggestion) {
    return (
      <div className={styles.c106}>
        <div className={styles.c128}>
          <Sparkles className={styles.c129} />
          <p className={styles.c037}>All suggestions processed</p>
          <p className={styles.c130}>
            {confirmedCount} confirmed, {totalCount - confirmedCount - pendingCount} fixed
          </p>
        </div>
      </div>
    );
  }

  return null;
}
