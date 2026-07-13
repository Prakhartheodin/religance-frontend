"use client";

import { getBackendCompanies } from "@/shared/crm/store/companies-api";
import { getBackendContacts } from "@/shared/crm/store/contacts-api";
import { getBackendDeals } from "@/shared/crm/store/deals-api";
import { getBackendLeads } from "@/shared/crm/store/leads-api";
import { getBackendTimeline } from "@/shared/crm/store/timeline-api";
import {
  listOutlookAccounts,
  listOutlookThreads,
  type OutlookThreadItem,
} from "@/shared/crm/store/outlook-api";
import type {
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmEmail,
  CrmLead,
  CrmTimelineEvent,
} from "@/shared/crm/store/types";

export type ReportsGraph = {
  companies: CrmCompany[];
  contacts: CrmContact[];
  leads: CrmLead[];
  deals: CrmDeal[];
  timeline: CrmTimelineEvent[];
};

export type ReportsLivePayload = {
  graph: ReportsGraph;
  emails: CrmEmail[];
};

type JsonResult<T> = { live: true; data: T } | { live: false; error: string };

function extractEmailAddress(raw: string): string {
  const s = String(raw || "").trim();
  const m = s.match(/<([^>]+)>/);
  return (m ? m[1] : s).trim().toLowerCase();
}

function mapThreadToEmail(
  thread: OutlookThreadItem,
  accountEmail: string,
  direction: "inbound" | "outbound"
): CrmEmail {
  const threadId = thread.threadId || thread.id;
  const fromEmail = extractEmailAddress(thread.from) || accountEmail;
  const toEmail = extractEmailAddress(thread.to) || accountEmail;

  return {
    id: thread.id,
    leadId: null,
    threadId,
    direction,
    mailboxLabels: thread.labelIds,
    subject: thread.subject?.trim() || "(No subject)",
    body: thread.snippet ?? "",
    preview: (thread.snippet ?? "").slice(0, 120),
    fromEmail,
    toEmail,
    sentAt: thread.date ?? new Date().toISOString(),
  };
}

export async function fetchReportsEmails(): Promise<JsonResult<CrmEmail[]>> {
  const accountsRes = await listOutlookAccounts();
  if (!accountsRes.live) {
    return { live: false, error: accountsRes.error };
  }

  const account =
    accountsRes.data.find((a) => a.status === "active") ?? accountsRes.data[0];
  if (!account) {
    return { live: true, data: [] };
  }

  const accountEmail = account.email.toLowerCase();
  const [sentRes, inboxRes] = await Promise.all([
    listOutlookThreads(account.id, 50, "SENT"),
    listOutlookThreads(account.id, 50, "INBOX"),
  ]);

  if (!sentRes.live && !inboxRes.live) {
    const err = !sentRes.live ? sentRes.error : inboxRes.error;
    return { live: false, error: err };
  }

  const byThread = new Map<string, CrmEmail>();

  const ingest = (
    threads: OutlookThreadItem[],
    defaultDirection: "inbound" | "outbound"
  ) => {
    for (const thread of threads) {
      const key = thread.threadId || thread.id;
      const from = extractEmailAddress(thread.from);
      const direction =
        from && from === accountEmail
          ? "outbound"
          : from && from !== accountEmail
            ? "inbound"
            : defaultDirection;

      const existing = byThread.get(key);
      const candidate = mapThreadToEmail(thread, accountEmail, direction);
      if (!existing) {
        byThread.set(key, candidate);
        continue;
      }

      const existingDate = new Date(existing.sentAt).getTime();
      const candidateDate = new Date(candidate.sentAt).getTime();
      if (candidateDate >= existingDate) {
        byThread.set(key, {
          ...candidate,
          direction:
            existing.direction !== candidate.direction
              ? candidate.direction === "inbound" ||
                existing.direction === "inbound"
                ? "inbound"
                : "outbound"
              : candidate.direction,
        });
      }
    }
  };

  if (sentRes.live) ingest(sentRes.data.threads, "outbound");
  if (inboxRes.live) ingest(inboxRes.data.threads, "inbound");

  const emails = [...byThread.values()].sort((a, b) =>
    b.sentAt.localeCompare(a.sentAt)
  );

  return { live: true, data: emails };
}

export async function fetchReportsLiveData(): Promise<
  JsonResult<ReportsLivePayload>
> {
  const [
    companiesRes,
    contactsRes,
    leadsRes,
    dealsRes,
    timelineRes,
    emailsRes,
  ] = await Promise.all([
    getBackendCompanies(),
    getBackendContacts(),
    getBackendLeads(),
    getBackendDeals(),
    getBackendTimeline(),
    fetchReportsEmails(),
  ]);

  const crmError = [
    companiesRes,
    contactsRes,
    leadsRes,
    dealsRes,
    timelineRes,
  ].find((r) => !r.live);

  if (crmError && !crmError.live) {
    return { live: false, error: crmError.error };
  }

  // Reports is read-only. It must never write, least of all a whole-array delete.
  const companies = companiesRes.live ? companiesRes.data : [];
  const contacts = contactsRes.live ? contactsRes.data : [];
  const leads = leadsRes.live ? leadsRes.data : [];
  const deals = dealsRes.live ? dealsRes.data : [];
  const timeline = timelineRes.live ? timelineRes.data : [];

  return {
    live: true,
    data: {
      graph: { companies, contacts, leads, deals, timeline },
      emails: emailsRes.live ? emailsRes.data : [],
    },
  };
}
