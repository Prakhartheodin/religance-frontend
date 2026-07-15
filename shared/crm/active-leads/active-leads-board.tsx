"use client";

import { ActiveLeadDetailDrawer } from "@/shared/crm/active-leads/active-lead-detail-drawer";
import {
  companyInitials,
  countLeadsByStage,
  filterLeadsForBoard,
  hasActiveLeadFilters,
  leadEditHref,
  leadNewHref,
} from "@/shared/crm/active-leads/active-leads-utils";
import { FollowUpDateCell } from "@/shared/crm/active-leads/follow-up-date-cell";
import LeadStageBadge from "@/shared/crm/active-leads/lead-stage-badge";
import { SendEmailModal } from "@/shared/crm/send-email/send-email-modal";
import { useCrm } from "@/shared/crm/store/crm-context";
import {
  isTerminalStage,
  LEAD_STAGES,
} from "@/shared/crm/active-leads/lead-stages";
import type { CrmLead, LeadStage } from "@/shared/crm/store/types";
import LeadScoreBadge from "@/shared/crm/lead-discovery/lead-score-badge";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 15, 25] as const;

type PipelineFilter = "all" | "active" | "closed";

const STAT_CARDS = [
  {
    key: "total",
    label: "Total leads",
    icon: "ri-folder-chart-line",
    tone: "primary",
  },
  {
    key: "active",
    label: "In pipeline",
    icon: "ri-pulse-line",
    tone: "success",
  },
  {
    key: "closed",
    label: "Closed",
    icon: "ri-archive-line",
    tone: "secondary",
  },
  {
    key: "dueSoon",
    label: "Follow-up due",
    icon: "ri-alarm-warning-line",
    tone: "warning",
  },
] as const;

const PIPELINE_TABS = [
  { id: "all" as const, label: "All", icon: "ri-list-check" },
  { id: "active" as const, label: "Pipeline", icon: "ri-git-branch-line" },
  { id: "closed" as const, label: "Closed", icon: "ri-checkbox-circle-line" },
];

export default function ActiveLeadsBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { leads, hydrated, pendingComposeLeadId, setPendingComposeLeadId } =
    useCrm();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "">("");
  const [saltFilter, setSaltFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [pipelineFilter, setPipelineFilter] =
    useState<PipelineFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [sendLead, setSendLead] = useState<CrmLead | null>(null);

  const companyFilter = searchParams.get("company") ?? "";

  const assignees = useMemo(
    () => [...new Set(leads.map((l) => l.assignedTo))].sort(),
    [leads]
  );
  const salts = useMemo(
    () => [...new Set(leads.map((l) => l.matchedSalt))].sort(),
    [leads]
  );

  const filterOpts = useMemo(
    () => ({
      search,
      stageFilter,
      saltFilter,
      assigneeFilter,
      pipelineFilter,
    }),
    [search, stageFilter, saltFilter, assigneeFilter, pipelineFilter]
  );

  const baseLeads = useMemo(
    () =>
      companyFilter
        ? leads.filter((l) => l.companyId === companyFilter)
        : leads,
    [leads, companyFilter]
  );

  const filteredLeads = useMemo(
    () => filterLeadsForBoard(baseLeads, filterOpts),
    [baseLeads, filterOpts]
  );

  const leadsForStageCounts = useMemo(
    () =>
      filterLeadsForBoard(baseLeads, {
        ...filterOpts,
        stageFilter: "",
      }),
    [baseLeads, filterOpts]
  );

  const stageCounts = useMemo(
    () => countLeadsByStage(leadsForStageCounts),
    [leadsForStageCounts]
  );

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const filtersActive = hasActiveLeadFilters(filterOpts);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, stageFilter, saltFilter, assigneeFilter, pipelineFilter, pageSize]);

  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page, pageSize]);

  const stats = useMemo(() => {
    const active = leads.filter((l) => !isTerminalStage(l.stage)).length;
    const closed = leads.length - active;
    const today = new Date().toISOString().slice(0, 10);
    const inThree = new Date();
    inThree.setDate(inThree.getDate() + 3);
    const soon = inThree.toISOString().slice(0, 10);
    const dueSoon = leads.filter(
      (l) =>
        l.followUpDate !== "—" &&
        !isTerminalStage(l.stage) &&
        l.followUpDate >= today &&
        l.followUpDate <= soon
    ).length;
    return { total: leads.length, active, closed, dueSoon };
  }, [leads]);

  useEffect(() => {
    if (!selectedLead) return;
    const fresh = leads.find((l) => l.id === selectedLead.id);
    if (fresh) setSelectedLead(fresh);
  }, [leads, selectedLead?.id]);

  useEffect(() => {
    if (!hydrated) return;
    const leadId = searchParams.get("lead");
    const composeId = searchParams.get("compose") ?? pendingComposeLeadId;
    if (leadId) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) setSelectedLead(lead);
    }
    if (composeId) {
      const lead = leads.find((l) => l.id === composeId);
      if (lead) {
        setSendLead(lead);
        setPendingComposeLeadId(null);
      }
    }
  }, [
    hydrated,
    searchParams,
    leads,
    pendingComposeLeadId,
    setPendingComposeLeadId,
  ]);

  const clearFilters = () => {
    setSearch("");
    setStageFilter("");
    setSaltFilter("");
    setAssigneeFilter("");
    setPipelineFilter("all");
  };

  const openLeadDrawer = (lead: CrmLead) => setSelectedLead(lead);

  const openLeadForm = (lead: CrmLead) => {
    router.push(leadEditHref(lead.id));
  };

  if (!hydrated) {
    return (
      <div className="text-center py-12 text-textmuted text-[0.875rem]">
        Loading leads…
      </div>
    );
  }

  return (
    <div className="active-leads-page">
      <div className="active-leads-page-header mb-4">
        <div>
          <h2 className="text-[1.125rem] font-semibold text-defaulttextcolor mb-1">
            Active Leads
          </h2>
          <p className="text-[0.8125rem] text-textmuted mb-0 max-w-xl">
            Track saved opportunities from discovery through outreach, samples,
            and closure.
          </p>
        </div>
        <button
          type="button"
          className="ti-btn ti-btn-primary shrink-0 inline-flex items-center justify-center gap-1 whitespace-nowrap !w-auto !h-auto !py-2 !px-3 !text-[0.8125rem]"
          onClick={() => router.push(leadNewHref())}
        >
          <i className="ri-add-line me-1"></i>
          New lead
        </button>
      </div>

      <div className="active-leads-stats mb-4">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className={`active-leads-stat-item tone-${card.tone}`}>
            <span className={`active-leads-stat-icon tone-${card.tone}`}>
              <i className={card.icon}></i>
            </span>
            <div>
              <p className="active-leads-stat-label">{card.label}</p>
              <p className="active-leads-stat-value">
                {stats[card.key as keyof typeof stats]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="box custom-box active-leads-main mb-0">
        <div className="active-leads-toolbar">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="active-leads-segmented" role="group" aria-label="Pipeline view">
              {PIPELINE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={pipelineFilter === tab.id ? "is-active" : ""}
                  onClick={() => setPipelineFilter(tab.id)}
                >
                  <i className={`${tab.icon} me-1`}></i>
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="text-[0.8125rem] text-textmuted">
              Showing{" "}
              <strong className="text-defaulttextcolor">
                {filteredLeads.length}
              </strong>{" "}
              of {leads.length}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-2 mb-3">
            <div className="xxl:col-span-4 lg:col-span-5 col-span-12">
              <label className="active-leads-filter-label">Search</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text !px-2.5 bg-white dark:bg-bodybg border-defaultborder dark:border-defaultborder/10">
                  <i className="ri-search-line text-textmuted"></i>
                </span>
                <input
                  type="search"
                  className="form-control !py-2 !text-[0.8125rem]"
                  placeholder="Lead, company, contact, salt…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search active leads"
                />
              </div>
            </div>
            <div className="xxl:col-span-2 lg:col-span-2 col-span-6">
              <label className="active-leads-filter-label">Stage</label>
              <select
                className="form-select form-select-sm !text-[0.8125rem] !py-2"
                value={stageFilter}
                onChange={(e) =>
                  setStageFilter(e.target.value as LeadStage | "")
                }
                aria-label="Filter by stage"
              >
                <option value="">All stages</option>
                {LEAD_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            <div className="xxl:col-span-2 lg:col-span-2 col-span-6">
              <label className="active-leads-filter-label">Salt</label>
              <select
                className="form-select form-select-sm !text-[0.8125rem] !py-2"
                value={saltFilter}
                onChange={(e) => setSaltFilter(e.target.value)}
                aria-label="Filter by salt"
              >
                <option value="">All salts</option>
                {salts.map((salt) => (
                  <option key={salt} value={salt}>
                    {salt}
                  </option>
                ))}
              </select>
            </div>
            <div className="xxl:col-span-2 lg:col-span-2 col-span-6">
              <label className="active-leads-filter-label">Assignee</label>
              <select
                className="form-select form-select-sm !text-[0.8125rem] !py-2"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                aria-label="Filter by assignee"
              >
                <option value="">All assignees</option>
                {assignees.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="xxl:col-span-2 lg:col-span-1 col-span-6">
              <label className="active-leads-filter-label active-leads-filter-label--action">
                Filters
              </label>
              {filtersActive ? (
                <button
                  type="button"
                  className="active-leads-filter-clear"
                  onClick={clearFilters}
                  aria-label="Clear all filters"
                >
                  <i className="ri-filter-off-line" aria-hidden="true"></i>
                  Clear
                </button>
              ) : (
                <div className="active-leads-filter-clear-spacer" aria-hidden="true" />
              )}
            </div>
          </div>

          <div className="active-leads-stage-chips" role="group" aria-label="Quick filter by stage">
            <button
              type="button"
              className={`active-leads-stage-chip ${stageFilter === "" ? "is-active" : ""}`}
              onClick={() => setStageFilter("")}
            >
              All stages
              <span className="chip-count">{leadsForStageCounts.length}</span>
            </button>
            {LEAD_STAGES.filter((s) => (stageCounts[s] ?? 0) > 0).map((stage) => (
              <button
                key={stage}
                type="button"
                className={`active-leads-stage-chip ${stageFilter === stage ? "is-active" : ""}`}
                onClick={() =>
                  setStageFilter(stageFilter === stage ? "" : stage)
                }
              >
                {stage}
                <span className="chip-count">{stageCounts[stage]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive active-leads-table">
          <table className="table table-hover ti-custom-table min-w-full mb-0 text-[0.8125rem]">
            <thead className="ti-custom-table-head">
              <tr>
                <th scope="col" className="!w-12"></th>
                <th scope="col">Lead & company</th>
                <th scope="col">Contact</th>
                <th scope="col">Product match</th>
                <th scope="col">Stage</th>
                <th scope="col">Score</th>
                <th scope="col">Follow-up</th>
                <th scope="col" className="!w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="!p-0 !border-0">
                    <div className="active-leads-empty">
                      <span className="avatar avatar-xl bg-primary/10 text-primary mb-3">
                        <i className="ri-inbox-line text-2xl"></i>
                      </span>
                      <p className="font-medium text-defaulttextcolor mb-1">
                        No leads match your filters
                      </p>
                      <p className="text-[0.8125rem] text-textmuted mb-3">
                        Try adjusting search, stage, or pipeline view.
                      </p>
                      {filtersActive && (
                        <button
                          type="button"
                          className="ti-btn ti-btn-primary active-leads-empty-cta"
                          onClick={clearFilters}
                        >
                          <i className="ri-filter-off-line me-1" aria-hidden="true"></i>
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const isSelected = selectedLead?.id === lead.id;
                  return (
                    <tr
                      key={lead.id}
                      className={`active-leads-row cursor-pointer ${isSelected ? "is-selected" : ""}`}
                      onClick={() => openLeadForm(lead)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openLeadForm(lead);
                        }
                      }}
                    >
                      <td className="!ps-3">
                        <span
                          className="active-leads-company-avatar"
                          title={lead.companyName}
                        >
                          {companyInitials(lead.companyName)}
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold text-defaulttextcolor leading-snug mb-0.5 max-w-[240px] truncate">
                          {lead.title}
                        </div>
                        <div className="flex items-center gap-1 text-[0.75rem] text-textmuted min-w-0">
                          <i className="ri-building-2-line shrink-0"></i>
                          <span className="truncate">{lead.companyName}</span>
                        </div>
                        <span className="text-[0.7rem] text-textmuted/80 truncate block max-w-[220px]">
                          {lead.location}
                        </span>
                      </td>
                      <td>
                        <div className="font-medium text-defaulttextcolor">
                          {lead.contactName}
                        </div>
                        <div className="text-[0.75rem] text-textmuted">
                          {lead.contactRole}
                        </div>
                        <div className="text-[0.7rem] text-primary/90 mt-0.5 flex items-center gap-1">
                          <i className="ri-user-line"></i>
                          {lead.assignedTo}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-defaulttextcolor font-normal text-[0.7rem] mb-1">
                          {lead.matchedSalt}
                        </span>
                        <div className="text-[0.75rem] text-textmuted truncate max-w-[180px]">
                          {lead.matchedMedicine}
                        </div>
                        <div className="text-[0.7rem] text-textmuted/80">
                          {lead.dosageForm}
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <LeadStageBadge stage={lead.stage} compact />
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <LeadScoreBadge score={lead.leadScore} />
                      </td>
                      <td>
                        <FollowUpDateCell followUpDate={lead.followUpDate} />
                      </td>
                      <td className="!pe-3 text-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="ti-btn ti-btn-sm ti-btn-icon ti-btn-light active-leads-row-chevron-btn"
                          aria-label="Quick view"
                          onClick={() => openLeadDrawer(lead)}
                        >
                          <i className="ri-arrow-right-s-line text-lg text-textmuted active-leads-row-chevron"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="box-footer active-leads-footer !px-3 !py-2.5 border-t border-defaultborder dark:border-defaultborder/10">
          <div className="lead-discovery-panel-footer min-h-[2rem]">
            <div className="flex items-center gap-2 justify-start min-w-0">
              <label className="flex items-center gap-1 mb-0 whitespace-nowrap shrink-0">
                <span className="text-[0.65rem] text-textmuted leading-none">
                  Show
                </span>
                <select
                  className="form-select form-select-sm !py-1 !ps-2 !pe-6 !text-[0.7rem] !w-[3.25rem] !min-h-[1.625rem] !leading-none"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  aria-label="Leads per page"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <nav aria-label="Active leads pagination" className="shrink-0">
              <ul className="ti-pagination pagination-sm mb-0 !py-0 flex-nowrap items-center">
                <li className="!flex items-center">
                  <button
                    type="button"
                    className="page-link !px-2 !py-1 !text-[0.7rem] !leading-none"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <li key={p} className="!flex items-center">
                      <button
                        type="button"
                        className={`page-link !px-2 !py-1 !text-[0.7rem] !leading-none min-w-[1.5rem] ${p === page ? "active" : ""}`}
                        onClick={() => setPage(p)}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </button>
                    </li>
                  )
                )}
                <li className="!flex items-center">
                  <button
                    type="button"
                    className="page-link !px-2 !py-1 !text-[0.7rem] !leading-none"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </li>
              </ul>
            </nav>

            <span className="text-[0.65rem] text-textmuted whitespace-nowrap tabular-nums">
              {page}/{totalPages}
            </span>
          </div>
        </div>
      </div>

      <ActiveLeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onSendEmail={(l) => setSendLead(l)}
      />

      <SendEmailModal
        lead={sendLead}
        onClose={() => setSendLead(null)}
      />
    </div>
  );
}
