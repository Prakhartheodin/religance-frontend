"use client";

import { STAGE_BADGE_CLASS } from "./lead-stages";
import type { LeadStage } from "./types";

export default function LeadStageBadge({
  stage,
  compact = false,
}: {
  stage: LeadStage;
  compact?: boolean;
}) {
  return (
    <span
      className={`badge leading-normal font-medium whitespace-nowrap inline-flex items-center gap-1 ${STAGE_BADGE_CLASS[stage]} ${
        compact ? "!text-[0.65rem] !py-0.5 !px-1.5" : ""
      }`}
    >
      <span
        className="size-1.5 rounded-full bg-current opacity-70 shrink-0"
        aria-hidden
      />
      {stage}
    </span>
  );
}
