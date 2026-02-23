/** Bottom player controls for transport, time, speed and volume. */
import { Lock, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { AudioPlayerState } from "@/lib/hooks/use-audio-player";

type PlayerControlsProps = {
  player: AudioPlayerState;
  activeFileDuration?: string;
  styles: Record<string, string>;
};

function formatTime(currentTime: number): string {
  const m = Math.floor(currentTime / 60);
  const s = Math.floor(currentTime % 60);
  const ms = Math.floor((currentTime % 1) * 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export default function PlayerControls({ player, activeFileDuration, styles }: PlayerControlsProps) {
  return (
    <div className={styles.c085}>
      <div className={styles.c080}>
        <button className={styles.c048}>
          <SkipBack className={styles.c046} />
        </button>
        <button onClick={player.toggle} className={styles.c086}>
          {player.isPlaying ? <Pause className={styles.c046} /> : <Play className={styles.c046} />}
        </button>
        <button className={styles.c048}>
          <SkipForward className={styles.c046} />
        </button>
      </div>

      <div className={styles.c087}>
        <span className={styles.c010}>{formatTime(player.currentTime)}</span>
        <span className={styles.c088}>/</span>
        <span>{activeFileDuration ?? "00:00"}</span>
      </div>

      <div className={styles.c089} />

      <button className={styles.c090}>
        <Lock className={styles.c053} />
      </button>

      <button
        onClick={() => player.setPlaybackRate(1.0)}
        className={styles.c091}
        title="Playback speed ([ / ] to adjust, click to reset)"
      >
        {player.playbackRate.toFixed(2).replace(/\.?0+$/, "")}x
      </button>

      <div className={styles.c052}>
        <button
          onClick={() => player.setVolume(player.volume > 0 ? 0 : 0.75)}
          className={styles.c092}
          title={player.volume > 0 ? "Mute" : "Unmute"}
        >
          {player.volume === 0 ? <VolumeX className={styles.c046} /> : <Volume2 className={styles.c046} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={player.volume}
          onChange={(e) => player.setVolume(parseFloat(e.target.value))}
          className={styles.c093}
          title={`Volume: ${Math.round(player.volume * 100)}%`}
        />
      </div>
    </div>
  );
}
