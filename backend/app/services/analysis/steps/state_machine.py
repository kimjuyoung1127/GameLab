"""StateMachineStep: ON/OFF 상태 전이.

Ported from SoundLab/frontend/src/core/analysis.py Step 3.
"""
import logging

from app.services.analysis.pipeline import AnalysisContext, PipelineStep

logger = logging.getLogger(__name__)


class StateMachineStep(PipelineStep):
    def execute(self, ctx: AnalysisContext) -> AnalysisContext:
        config = ctx.config
        threshold_cfg = config.get("threshold", {})
        hysteresis = threshold_cfg.get("hysteresis_factor", 0.8)

        threshold_id = ctx.thresholds.get("id_wide", 0.0)
        threshold_surge_60 = ctx.thresholds.get("surge_60", 0.0)
        threshold_surge_120 = ctx.thresholds.get("surge_120", 0.0)

        energies_id = ctx.energies.get("id_wide", [])
        energies_60 = ctx.energies.get("surge_60", [])
        energies_120 = ctx.energies.get("surge_120", [])

        current_state = "OFF"
        on_count = 0

        for i, chunk in enumerate(ctx.chunks):
            val_id = energies_id[i] if i < len(energies_id) else 0.0
            val_60 = energies_60[i] if i < len(energies_60) else 0.0
            val_120 = energies_120[i] if i < len(energies_120) else 0.0

            is_id_active = val_id > threshold_id
            is_surge = (val_60 > threshold_surge_60) and (val_120 > threshold_surge_120)

            if current_state == "OFF":
                if is_id_active:
                    current_state = "ON"
                    chunk["state"] = "ON"
                    chunk["note"] = "ID_Wide_Start"
                    on_count += 1
                elif is_surge:
                    current_state = "ON"
                    chunk["state"] = "ON"
                    chunk["note"] = "Startup_Surge_Start"
                    on_count += 1
                else:
                    chunk["state"] = "OFF"
            else:
                # Currently ON
                if is_id_active:
                    chunk["state"] = "ON"
                    chunk["note"] = "ID_Wide_Sustain"
                    on_count += 1
                else:
                    if val_id < threshold_id * hysteresis:
                        current_state = "OFF"
                        chunk["state"] = "OFF"
                    else:
                        chunk["state"] = "ON"
                        chunk["note"] = "Hysteresis_Sustain"
                        on_count += 1

        ctx.metadata["on_chunks_after_state_machine"] = on_count

        logger.info(
            "state_machine on_count=%d total=%d hysteresis=%.2f",
            on_count, len(ctx.chunks), hysteresis,
        )
        return ctx
