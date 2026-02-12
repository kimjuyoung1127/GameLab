"""TrimStep: 드롭오프 구간 안전 제거 (Smart Trimming).

Ported from SoundLab/frontend/src/core/analysis.py Step 5.
"""
import logging

from app.services.analysis.pipeline import AnalysisContext, PipelineStep

logger = logging.getLogger(__name__)


class TrimStep(PipelineStep):
    def execute(self, ctx: AnalysisContext) -> AnalysisContext:
        config = ctx.config
        trim_cfg = config.get("trim", {})
        chunk_duration = config.get("chunk_duration_sec", 5.0)

        safety_buffer_sec = trim_cfg.get("safety_buffer_sec", 60.0)
        drop_ratio = trim_cfg.get("drop_ratio", 0.5)
        drop_threshold_factor = trim_cfg.get("drop_threshold_factor", 0.5)

        threshold_id = ctx.thresholds.get("id_wide", 0.0)
        energies_id = ctx.energies.get("id_wide", [])
        chunks = ctx.chunks

        chunks_safety = int(safety_buffer_sec / chunk_duration)
        trimmed_count = 0
        seg_start = -1

        for i in range(len(chunks)):
            if chunks[i]["state"] == "ON":
                if seg_start == -1:
                    seg_start = i

                if i > seg_start + chunks_safety and i > 0:
                    prev_val = energies_id[i - 1] if (i - 1) < len(energies_id) else 0
                    curr_val = energies_id[i] if i < len(energies_id) else 0
                    ratio = (curr_val / prev_val) if prev_val > 0 else 1.0

                    if ratio < drop_ratio and curr_val < threshold_id * drop_threshold_factor:
                        for k in range(i, len(chunks)):
                            if chunks[k]["state"] == "OFF":
                                break
                            chunks[k]["state"] = "OFF"
                            chunks[k]["note"] = "Trimmed_DropOff"
                            trimmed_count += 1
                        seg_start = -1
            else:
                seg_start = -1

        ctx.metadata["trimmed_chunks"] = trimmed_count

        logger.info(
            "trim safety_sec=%.0f trimmed=%d", safety_buffer_sec, trimmed_count,
        )
        return ctx
