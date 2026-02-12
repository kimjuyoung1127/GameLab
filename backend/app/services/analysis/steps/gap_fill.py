"""GapFillStep: 짧은 갭 채우기 (≤N분).

Ported from SoundLab/frontend/src/core/analysis.py Step 4.
"""
import logging

from app.services.analysis.pipeline import AnalysisContext, PipelineStep

logger = logging.getLogger(__name__)


class GapFillStep(PipelineStep):
    def execute(self, ctx: AnalysisContext) -> AnalysisContext:
        config = ctx.config
        gap_cfg = config.get("gap_fill", {})
        max_gap_min = gap_cfg.get("max_gap_minutes", 2.0)
        chunk_duration = config.get("chunk_duration_sec", 5.0)

        chunks = ctx.chunks
        filled_count = 0
        last_on = -1

        for i, chunk in enumerate(chunks):
            if chunk["state"] == "ON":
                if last_on != -1:
                    gap_min = (
                        chunk["time_min"]
                        - chunks[last_on]["time_min"]
                        - (chunk_duration / 60.0)
                    )
                    if 0 < gap_min <= max_gap_min:
                        for k in range(last_on + 1, i):
                            chunks[k]["state"] = "ON"
                            chunks[k]["note"] = "Gap_Filled"
                            filled_count += 1
                last_on = i

        ctx.metadata["gap_filled_chunks"] = filled_count

        logger.info(
            "gap_fill max_gap_min=%.1f filled=%d", max_gap_min, filled_count,
        )
        return ctx
