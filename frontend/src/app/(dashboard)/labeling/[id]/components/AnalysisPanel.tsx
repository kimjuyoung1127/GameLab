/** Right panel with AI analysis cards, properties, and next action. */
import { ChevronRight, Filter, Sparkles } from "lucide-react";
import type { AISuggestion, LabelingMode } from "@/types";
import StatusPills from "./StatusPills";
import SuggestionCard from "./SuggestionCard";

type AnalysisPanelProps = {
  mode: LabelingMode;
  activeSuggestion: AISuggestion | null;
  rejectedSuggestion: AISuggestion | null;
  pendingCount: number;
  confirmedCount: number;
  totalCount: number;
  onConfirm: () => void;
  onReject: () => void;
  onApplyFix: () => void;
  onNextFile: () => void;
  styles: Record<string, string>;
};

export default function AnalysisPanel({
  mode,
  activeSuggestion,
  rejectedSuggestion,
  pendingCount,
  confirmedCount,
  totalCount,
  onConfirm,
  onReject,
  onApplyFix,
  onNextFile,
  styles,
}: AnalysisPanelProps) {
  return (
    <aside className={styles.c098}>
      <div className={styles.c099}>
        <Sparkles className={styles.c100} />
        <h2 className={styles.c101}>AI Analysis</h2>
        <StatusPills
          pendingCount={pendingCount}
          confirmedCount={confirmedCount}
          fixedCount={totalCount - pendingCount - confirmedCount}
          styles={styles}
        />
      </div>

      <SuggestionCard
        mode={mode}
        activeSuggestion={activeSuggestion}
        rejectedSuggestion={rejectedSuggestion}
        confirmedCount={confirmedCount}
        pendingCount={pendingCount}
        totalCount={totalCount}
        onConfirm={onConfirm}
        onReject={onReject}
        onApplyFix={onApplyFix}
        styles={styles}
      />

      <div className={styles.c131}>
        <div className={styles.c132}>
          <div className={styles.c133}>
            <Filter className={styles.c100} />
          </div>
          <div className={styles.c134}>
            <h4 className={styles.c135}>Apply Noise Reduction?</h4>
            <p className={styles.c110}>Filters background hum (-12dB)</p>
          </div>
          <button className={styles.c136}>APPLY</button>
        </div>
      </div>

      <div className={styles.c131}>
        <h3 className={styles.c137}>Properties</h3>
        <div className={styles.c138}>
          <div>
            <label className={styles.c139}>Sensor ID</label>
            <input type="text" defaultValue="TURB-X42-A" className={styles.c140} />
          </div>
          <div>
            <label className={styles.c139}>Sample Rate</label>
            <input type="text" defaultValue="44,100 Hz" className={styles.c140} />
          </div>
        </div>
        <div className={styles.c141}>
          <label className={styles.c139}>Duration</label>
          <input type="text" defaultValue="00:08:22.00" className={styles.c140} />
        </div>
        <div className={styles.c141}>
          <label className={styles.c139}>Captured At</label>
          <input type="text" defaultValue="Oct 24, 2023 - 14:30 UTC" className={styles.c140} />
        </div>
      </div>

      <div className={styles.c131}>
        <h3 className={styles.c142}>Notes</h3>
        <textarea
          placeholder="Add annotation notes here..."
          rows={3}
          className={styles.c143}
        />
      </div>

      <div className={styles.c144}>
        <button onClick={onNextFile} className={styles.c145}>
          Save &amp; Next File
          <ChevronRight className={styles.c046} />
        </button>
      </div>
    </aside>
  );
}
