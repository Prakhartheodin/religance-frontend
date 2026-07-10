"use client";

import { getFollowUpStatus } from "./active-leads-utils";

function formatTableDate(iso: string) {
  if (iso === "—") return "—";
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export function FollowUpDateCell({ followUpDate }: { followUpDate: string }) {
  const status = getFollowUpStatus(followUpDate);
  const label = formatTableDate(followUpDate);

  if (status === "none") {
    return <span className="text-textmuted">—</span>;
  }

  const statusClass =
    status === "overdue"
      ? "text-danger"
      : status === "soon"
        ? "text-warning"
        : "text-defaulttextcolor";

  const badge =
    status === "overdue" ? (
      <span className="badge bg-danger/10 text-danger text-[0.6rem] ms-1">
        Overdue
      </span>
    ) : status === "soon" ? (
      <span className="badge bg-warning/10 text-warning text-[0.6rem] ms-1">
        Due soon
      </span>
    ) : null;

  return (
    <span className={`inline-flex items-center flex-wrap gap-0.5 tabular-nums ${statusClass}`}>
      <i
        className={`ri-calendar-line text-[0.875rem] ${
          status === "overdue"
            ? "text-danger"
            : status === "soon"
              ? "text-warning"
              : "text-textmuted"
        }`}
        aria-hidden
      />
      {label}
      {badge}
    </span>
  );
}
