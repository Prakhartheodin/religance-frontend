"use client";

import type { ReactNode } from "react";

type LeadFormSectionShellProps = {
  title: string;
  children: ReactNode;
  badge?: string;
};

export function LeadFormSectionShell({
  title,
  children,
  badge,
}: LeadFormSectionShellProps) {
  return (
    <div className="box custom-box mb-4">
      <div className="box-header border-b border-defaultborder dark:border-defaultborder/10 flex items-center justify-between gap-2 min-w-0">
        <h6 className="box-title mb-0 before:!hidden truncate">{title}</h6>
        {badge && (
          <span className="badge bg-secondary/10 text-secondary text-[0.7rem] shrink-0">
            {badge}
          </span>
        )}
      </div>
      <div className="box-body">{children}</div>
    </div>
  );
}

function LeadFormEmptyTable({ message }: { message: string }) {
  return (
    <p className="text-[0.8125rem] text-textmuted dark:text-textmuted/90 mb-0 py-3 px-1">
      {message}
    </p>
  );
}

export function LeadFormDataTable({
  columns,
  rows,
  emptyMessage,
}: {
  columns: string[];
  rows: ReactNode[][];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <LeadFormEmptyTable message={emptyMessage} />;
  }
  return (
    <div className="table-responsive lead-form-table-wrap">
      <table className="table ti-custom-table min-w-full mb-0 text-[0.75rem]">
        <thead className="ti-custom-table-head">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="text-[0.6875rem] uppercase tracking-wide whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, rowIdx) => (
            <tr key={rowIdx}>
              {cells.map((cell, cellIdx) => (
                <td key={cellIdx} className="align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
