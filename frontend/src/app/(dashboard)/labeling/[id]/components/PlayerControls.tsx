/** Bottom player controls with transport, loop/bookmark actions, and volume. */
import { BookmarkPlus, Flag, Lock, Pause, Play, Repeat, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BookmarkType } from "@/types";
import type { AudioPlayerState } from "@/lib/hooks/use-audio-player";

type BookmarkPreset = { type: BookmarkType; label: string; note: string };

type PlayerControlsProps = {
  player: AudioPlayerState;
  activeFileDuration?: string;
  loopEnabled: boolean;
  onSetLoopStart: () => void;
  onSetLoopEnd: () => void;
  onToggleLoop: () => void;
  onAddBookmark: (preset: BookmarkPreset) => void;
  bookmarkPreset: BookmarkPreset;
};

function formatTime(currentTime: number): string {
  const m = Math.floor(currentTime / 60);
  const s = Math.floor(currentTime % 60);
  const ms = Math.floor((currentTime % 1) * 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export default function PlayerControls({
  player,
  activeFileDuration,
  loopEnabled,
  onSetLoopStart,
  onSetLoopEnd,
  onToggleLoop,
  onAddBookmark,
  bookmarkPreset,
}: PlayerControlsProps) {
  const t = useTranslations("labeling");

  return (
    <div className="h-14 shrink-0 bg-panel border-t border-border flex items-center px-4 gap-4">
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors">
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={player.toggle}
          disabled={!player.canPlay}
          className="p-2.5 rounded-lg bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {player.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors">
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <div className="text-xs font-mono text-text-secondary tabular-nums">
        <span className="text-text font-medium">{formatTime(player.currentTime)}</span>
        <span className="mx-1 text-text-muted">/</span>
        <span>{activeFileDuration ?? "00:00"}</span>
      </div>

      <div className="flex-1" />

      <button className="p-1.5 rounded-md text-text-muted hover:text-text-secondary transition-colors">
        <Lock className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => player.setPlaybackRate(1.0)}
        title={t("playbackSpeedTitle")}
        className="text-[11px] font-medium text-text-secondary bg-surface px-2 py-1 rounded-md hover:bg-panel-light transition-colors"
      >
        {player.playbackRate.toFixed(2)}x
      </button>

      <button onClick={onSetLoopStart} className="p-1.5 rounded-md text-text-muted hover:text-text-secondary transition-colors" title={t("loopIn")}>
        <Flag className="w-3.5 h-3.5" />
      </button>

      <button onClick={onSetLoopEnd} className="p-1.5 rounded-md text-text-muted hover:text-text-secondary transition-colors" title={t("loopOut")}>
        <Flag className="w-3.5 h-3.5 rotate-180" />
      </button>

      <button
        onClick={onToggleLoop}
        className={`p-1.5 rounded-md transition-colors ${loopEnabled ? "text-accent bg-accent/10" : "text-text-muted hover:text-text-secondary"}`}
        title={t("loopToggle")}
      >
        <Repeat className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onAddBookmark(bookmarkPreset)}
        className="p-1.5 rounded-md text-text-muted hover:text-text-secondary transition-colors"
        title={t("bookmarkAdd")}
      >
        <BookmarkPlus className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => player.setVolume(player.volume > 0 ? 0 : 0.75)}
          disabled={!player.canPlay}
          className="p-0.5 rounded text-text-muted hover:text-text-secondary transition-colors"
          title={player.volume > 0 ? t("mute") : t("unmute")}
        >
          {player.volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={player.volume}
          onChange={(e) => player.setVolume(parseFloat(e.target.value))}
          disabled={!player.canPlay}
          className="w-20 h-1 accent-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title={t("volumeTitle", { percent: Math.round(player.volume * 100) })}
        />
      </div>
    </div>
  );
}
