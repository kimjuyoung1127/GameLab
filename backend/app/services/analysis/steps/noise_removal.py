"""NoiseRemovalStep: 짧은 세그먼트 필터링.

Ported from SoundLab/frontend/src/core/analysis.py Step 6.
"""
import logging

from app.services.analysis.pipeline import AnalysisContext, PipelineStep

logger = logging.getLogger(__name__)


class NoiseRemovalStep(PipelineStep):
    def execute(self, ctx: AnalysisContext) -> AnalysisContext:
        config = ctx.config
        nr_cfg = config.get("noise_removal", {})
        chunk_duration = config.get("chunk_duration_sec", 5.0)

        min_dur_min = nr_cfg.get("min_segment_duration_minutes", 1.0)
        min_dur_chunks = int(min_dur_min * 60.0 / chunk_duration)

        chunks = ctx.chunks
        removed_count = 0
        on_start = -1

        for i, chunk in enumerate(chunks):
            if chunk["state"] == "ON":
                if on_start == -1:
                    on_start = i
            else:
                if on_start != -1:
                    seg_len = i - on_start
                    if seg_len < min_dur_chunks:
                        for k in range(on_start, i):
                            chunks[k]["state"] = "OFF"
                            chunks[k]["note"] = "Noise_Removed"
                            removed_count += 1
                    on_start = -1

        # 마지막 세그먼트 체크
        if on_start != -1:
            seg_len = len(chunks) - on_start
            if seg_len < min_dur_chunks:
                for k in range(on_start, len(chunks)):
                    chunks[k]["state"] = "OFF"
                    chunks[k]["note"] = "Noise_Removed"
                    removed_count += 1

        ctx.metadata["noise_removed_chunks"] = removed_count

        logger.info(
            "noise_removal min_dur_min=%.1f removed=%d", min_dur_min, removed_count,
        )
        return ctx
