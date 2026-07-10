"use client";

import {
  getLeadScoreLabel,
  getLeadScoreTier,
} from "@/shared/crm/lead-discovery/utils";

const TIER_CLASSES: Record<string, string> = {
  hot: "bg-success/10 text-success",
  warm: "bg-warning/10 text-warning",
  cold: "bg-secondary/10 text-secondary",
};

export default function LeadScoreBadge({ score }: { score: number }) {
  const tier = getLeadScoreTier(score);
  return (
    <span
      className={`badge leading-none ${TIER_CLASSES[tier]} font-medium`}
      title={getLeadScoreLabel(tier)}
    >
      {score}
      <span className="text-[0.65rem] opacity-80 ms-1 hidden sm:inline">
        · {getLeadScoreLabel(tier)}
      </span>
    </span>
  );
}
