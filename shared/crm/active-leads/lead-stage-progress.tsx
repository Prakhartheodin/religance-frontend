"use client";

import {
  getPipelineProgress,
  isTerminalStage,
  PIPELINE_STAGES,
} from "./lead-stages";
import type { LeadStage } from "./types";

export function LeadStageProgress({ stage }: { stage: LeadStage }) {
  const progress = getPipelineProgress(stage);
  const terminal = isTerminalStage(stage);

  return (
    <div className="active-leads-stage-progress">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[0.75rem] font-medium text-textmuted">
          Pipeline progress
        </span>
        <span className="text-[0.75rem] font-semibold text-primary tabular-nums">
          {terminal ? stage : `${progress}%`}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full bg-light dark:bg-black/30 overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            stage === "Lost"
              ? "bg-danger"
              : stage === "Won"
                ? "bg-success"
                : stage === "Dormant"
                  ? "bg-secondary"
                  : "bg-primary"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {!terminal && (
        <div className="flex justify-between gap-0.5 mt-2">
          {PIPELINE_STAGES.map((s, i) => {
            const currentIdx = PIPELINE_STAGES.indexOf(stage);
            const done = i <= currentIdx;
            return (
              <span
                key={s}
                title={s}
                className={`flex-1 h-1 rounded-sm ${
                  done ? "bg-primary/70" : "bg-defaultborder/40 dark:bg-white/10"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
