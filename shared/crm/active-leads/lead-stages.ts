import type { LeadStage } from "@/shared/crm/store/types";

export const LEAD_STAGES: LeadStage[] = [
  "Saved",
  "Verified",
  "Intro Email Sent",
  "Follow-up Sent",
  "Replied",
  "Sample Requested",
  "Quotation Sent",
  "Negotiation",
  "Won",
  "Lost",
  "Dormant",
];

export const TERMINAL_STAGES: LeadStage[] = ["Won", "Lost", "Dormant"];

export function isTerminalStage(stage: LeadStage): boolean {
  return TERMINAL_STAGES.includes(stage);
}

/** Pipeline stages used for progress (excludes terminal outcomes). */
export const PIPELINE_STAGES: LeadStage[] = LEAD_STAGES.filter(
  (s) => !TERMINAL_STAGES.includes(s)
);

export function getStageIndex(stage: LeadStage): number {
  return LEAD_STAGES.indexOf(stage);
}

export function getNextLeadStage(stage: LeadStage): LeadStage | null {
  if (isTerminalStage(stage)) return null;
  const idx = PIPELINE_STAGES.indexOf(stage);
  if (idx < 0 || idx >= PIPELINE_STAGES.length - 1) return null;
  return PIPELINE_STAGES[idx + 1];
}

export function getPipelineProgress(stage: LeadStage): number {
  if (isTerminalStage(stage)) {
    return stage === "Won" ? 100 : stage === "Lost" ? 0 : 15;
  }
  const idx = PIPELINE_STAGES.indexOf(stage);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100);
}

export const STAGE_BADGE_CLASS: Record<LeadStage, string> = {
  Saved: "bg-secondary/10 text-secondary",
  Verified: "bg-info/10 text-info",
  "Intro Email Sent": "bg-primary/10 text-primary",
  "Follow-up Sent": "bg-primary/10 text-primary",
  Replied: "bg-success/10 text-success",
  "Sample Requested": "bg-warning/10 text-warning",
  "Quotation Sent": "bg-warning/10 text-warning",
  Negotiation: "bg-warning/15 text-warning",
  Won: "bg-success/10 text-success",
  Lost: "bg-danger/10 text-danger",
  Dormant: "bg-secondary/10 text-secondary",
};
