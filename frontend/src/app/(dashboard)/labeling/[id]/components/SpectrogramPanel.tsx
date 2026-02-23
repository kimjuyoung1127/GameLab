/** Spectrogram area with waveform, annotation boxes, cursor and mobile actions. */
import { Check, Sparkles, Wrench, X } from "lucide-react";
import WaveformCanvas from "@/components/domain/labeling/WaveformCanvas";
import type { AudioPlayerState } from "@/lib/hooks/use-audio-player";
import type { AISuggestion, SuggestionStatus, WaveformData } from "@/types";

type SpectrogramPanelProps = {
  waveformData: WaveformData | null;
  player: AudioPlayerState;
  totalDuration: number;
  zoomLevel: number;
  fileCompleteToast: boolean;
  isLastFile: boolean;
  suggestions: AISuggestion[];
  selectedSuggestionId: string | null;
  selectSuggestion: (id: string | null) => void;
  playbackPct: number;
  activeSuggestion: AISuggestion | undefined;
  onConfirm: () => void;
  onReject: () => void;
  onToggleHotkeyHelp: () => void;
  suggestionBoxStyle: (s: AISuggestion, totalDuration: number) => {
    left: string;
    width: string;
    top: string;
    height: string;
  };
  statusColors: Record<
    SuggestionStatus,
    { border: string; bg: string; tagBg: string; label: string; dashed: boolean }
  >;
  styles: Record<string, string>;
};

export default function SpectrogramPanel({
  waveformData,
  player,
  totalDuration,
  zoomLevel,
  fileCompleteToast,
  isLastFile,
  suggestions,
  selectedSuggestionId,
  selectSuggestion,
  playbackPct,
  activeSuggestion,
  onConfirm,
  onReject,
  onToggleHotkeyHelp,
  suggestionBoxStyle,
  statusColors,
  styles,
}: SpectrogramPanelProps) {
  return (
    <>
      <div className={styles.c055}>
        {waveformData && (
          <div className={styles.c056}>
            <WaveformCanvas
              peaks={waveformData.peaks}
              currentTime={player.currentTime}
              duration={totalDuration}
              onSeek={player.seek}
            />
          </div>
        )}

        <div
          className={styles.c057}
          style={zoomLevel !== 1 ? { transform: `scale(${zoomLevel})`, transformOrigin: "top left" } : undefined}
        >
          {fileCompleteToast && (
            <div className={styles.c058}>
              <div className={styles.c059}>
                <Check className={styles.c060} />
                <p className={styles.c061}>{isLastFile ? "All Files Complete!" : "File Complete!"}</p>
                <p className={styles.c062}>{isLastFile ? "Returning to sessions..." : "Moving to next file..."}</p>
              </div>
            </div>
          )}

          <div className={styles.c063}>
            {["20kHz", "15kHz", "10kHz", "5kHz", "0Hz"].map((label) => (
              <span key={label} className={styles.c064}>
                {label}
              </span>
            ))}
          </div>

          <div className={styles.c065}>
            <div className={styles.c066}>
              {[20, 40, 60, 80].map((pct) => (
                <div key={pct} className={styles.c067} style={{ top: `${pct}%` }} />
              ))}
            </div>
            <div className={styles.c066}>
              {[20, 40, 60, 80].map((pct) => (
                <div key={pct} className={styles.c068} style={{ left: `${pct}%` }} />
              ))}
            </div>
            <div className={styles.c069} />
            <div className={styles.c070} />
            <div className={styles.c071} />
            <div className={styles.c072} />
          </div>

          {suggestions.map((s) => {
            const sc = statusColors[s.status];
            const isSelected = s.id === selectedSuggestionId;
            const boxPos = suggestionBoxStyle(s, totalDuration);
            return (
              <button
                key={s.id}
                onClick={() => selectSuggestion(s.id)}
                className={`absolute border-2 rounded-sm z-20 transition-all duration-200 ${
                  sc.border
                } ${sc.dashed ? "border-dashed" : ""} ${
                  isSelected
                    ? "ring-2 ring-white/30 shadow-lg shadow-white/10"
                    : "hover:ring-1 hover:ring-white/20"
                }`}
                style={{
                  left: `calc(48px + ${boxPos.left})`,
                  top: boxPos.top,
                  width: boxPos.width,
                  height: boxPos.height,
                  minWidth: "40px",
                  minHeight: "20px",
                }}
              >
                <div
                  className={`absolute -top-5 left-0 ${sc.tagBg} text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 whitespace-nowrap`}
                >
                  {s.status === "pending" && <Sparkles className={styles.c073} />}
                  {s.status === "confirmed" && <Check className={styles.c073} />}
                  {s.status === "rejected" && <X className={styles.c073} />}
                  {s.status === "corrected" && <Wrench className={styles.c073} />}
                  {s.label.slice(0, 18)}
                </div>
                {isSelected && (
                  <>
                    <div className={`absolute -top-1 -left-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                    <div className={`absolute -top-1 -right-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                    <div className={`absolute -bottom-1 -left-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                    <div className={`absolute -bottom-1 -right-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                  </>
                )}
                <span className={styles.c074} style={{ color: "inherit" }}>
                  <span className={sc.label}>{s.confidence}%</span>
                </span>
              </button>
            );
          })}

          <div className={styles.c075} style={{ left: `calc(48px + ${playbackPct}%)` }}>
            <div className={styles.c076} />
          </div>

          <div className={styles.c077}>
            {Array.from({ length: 6 }, (_, i) => {
              const t = (totalDuration / 5) * i;
              const m = Math.floor(t / 60);
              const sec = Math.floor(t % 60);
              return (
                <span key={i} className={styles.c078}>
                  {String(m).padStart(2, "0")}:{String(sec).padStart(2, "0")}
                </span>
              );
            })}
          </div>

          <div className={styles.c079}>
            {(["pending", "confirmed", "rejected", "corrected"] as const).map((st) => {
              const c = statusColors[st];
              return (
                <div key={st} className={styles.c080}>
                  <span className={`inline-block w-2 h-2 rounded-sm ${c.bg} ${c.dashed ? "opacity-70" : ""}`} />
                  <span className={styles.c081}>{st}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.c082}>
            {[
              { key: "O", label: "Confirm" },
              { key: "X", label: "Reject" },
              { key: "B", label: "Brush" },
              { key: "R", label: "Box" },
              { key: "^Z", label: "Undo" },
            ].map((hint) => (
              <div key={hint.key} className={styles.c083}>
                <span className={styles.c084}>{hint.key}</span> {hint.label}
              </div>
            ))}
            <button onClick={onToggleHotkeyHelp} className={styles.c083} title="All shortcuts">
              <span className={styles.c084}>?</span> More
            </button>
          </div>
        </div>
      </div>

      <div className={styles.c094}>
        <div className={styles.c037}>
          {activeSuggestion ? (
            <span>
              <span className={styles.c095}>{activeSuggestion.label}</span> | {activeSuggestion.confidence}%
            </span>
          ) : (
            <span>No suggestion selected</span>
          )}
        </div>
        <div className={styles.c052}>
          <button
            onClick={onConfirm}
            disabled={!activeSuggestion || activeSuggestion.status !== "pending"}
            className={styles.c096}
          >
            <Check className={styles.c053} /> OK
          </button>
          <button
            onClick={onReject}
            disabled={!activeSuggestion || activeSuggestion.status !== "pending"}
            className={styles.c097}
          >
            <X className={styles.c053} /> NG
          </button>
        </div>
      </div>
    </>
  );
}
