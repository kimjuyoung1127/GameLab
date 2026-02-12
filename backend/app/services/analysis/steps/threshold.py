"""OtsuThresholdStep: Otsu 임계값 + surge median 계산.

Ported from SoundLab/frontend/src/core/analysis.py Step 2.
"""
import logging

import numpy as np
from skimage.filters import threshold_otsu

from app.services.analysis.pipeline import AnalysisContext, PipelineStep

logger = logging.getLogger(__name__)


class OtsuThresholdStep(PipelineStep):
    def execute(self, ctx: AnalysisContext) -> AnalysisContext:
        config = ctx.config
        threshold_cfg = config.get("threshold", {})
        surge_cfg = config.get("surge", {})

        multiplier = threshold_cfg.get("multiplier", 1.5)
        surge_median_mult = surge_cfg.get("median_multiplier", 2.0)

        # ID band Otsu threshold
        energies_id = ctx.energies.get("id_wide", np.array([]))
        if len(energies_id) > 0:
            try:
                otsu_val = float(threshold_otsu(energies_id))
            except Exception:
                otsu_val = 0.0
        else:
            otsu_val = 0.0

        threshold_id = otsu_val * multiplier
        ctx.thresholds["id_wide"] = threshold_id
        ctx.metadata["otsu_val"] = otsu_val
        ctx.metadata["threshold_id"] = threshold_id

        # Surge band thresholds (median * multiplier)
        for band_key in ("surge_60", "surge_120"):
            energies = ctx.energies.get(band_key, np.array([]))
            if len(energies) > 0:
                median_val = float(np.median(energies))
            else:
                median_val = 0.0
            ctx.thresholds[band_key] = median_val * surge_median_mult

        logger.info(
            "threshold otsu=%.4f multiplier=%.1f threshold_id=%.4f",
            otsu_val, multiplier, threshold_id,
        )
        return ctx
