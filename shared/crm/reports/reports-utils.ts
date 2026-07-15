import {
  isTerminalStage,
  LEAD_STAGES,
} from "@/shared/crm/active-leads/lead-stages";
import type {
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmEmail,
  CrmLead,
  CrmTimelineEvent,
  LeadStage,
} from "@/shared/crm/store/types";

export const DASHBOARD_COLORS = {
  purple: "#845adf",
  teal: "#23b7e5",
  yellow: "#f5b849",
  green: "#26bf94",
  muted: "#6b7280",
} as const;

export type SalesStatCard = {
  id: string;
  title: string;
  value: string;
  period: string;
  change: number;
  changePositive: boolean;
  href: string;
  icon: string;
};

export type MetricCardData = {
  id: string;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  iconBg: "primary" | "secondary" | "success" | "warning";
  linkClass: string;
  icon: string;
  sparkColor: string;
  sparkline: number[];
};

export type RecentOutreachItem = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  amountPositive: boolean;
  date: string;
  iconBg:
    | "primary"
    | "info"
    | "warning"
    | "danger"
    | "success"
    | "pinkmain";
};

export type ActivityItem = {
  id: string;
  highlight: string;
  text: string;
  time: string;
  tone: "primary" | "success" | "danger" | "warning";
};

export type LeadSourceItem = {
  label: string;
  count: number;
  color: string;
  legendClass: "mobile" | "desktop" | "laptop" | "tablet";
};

export type TopDealRow = {
  id: string;
  name: string;
  email: string;
  amount: string;
  initials: string;
  avatarHue: number;
  avatarClass: "primary" | "success" | "warning" | "secondary" | "info";
};

export type DealStatusItem = {
  label: string;
  count: number;
  statusClass: "primary" | "info" | "warning" | "success";
  segmentClass: string;
};

export type RecentContactRow = {
  id: string;
  name: string;
  subtitle: string;
  time: string;
  initials: string;
  avatarClass: "primary" | "success" | "warning" | "secondary" | "info";
};

export type SaltCategoryRow = {
  name: string;
  count: number;
  pct: number;
};

export type PipelineTableRow = {
  id: string;
  leadId: string;
  company: string;
  contact: string;
  salt: string;
  stage: string;
  stageBadgeClass: string;
  assignee: string;
  assigneeInitials: string;
  date: string;
  score: number;
};

export type FollowUpTask = {
  id: string;
  leadId: string;
  detail: string;
  assignedDate: string;
  target: string;
  targetBadgeClass: string;
  assignee: string;
  assigneeInitials: string;
  completed: boolean;
};

export type ReportsSnapshot = {
  targetPercent: number;
  winRate: number;
  replyRate: number;
  salesStats: SalesStatCard[];
  metricCards: MetricCardData[];
  recentOutreach: RecentOutreachItem[];
  activities: ActivityItem[];
  leadsBySource: { items: LeadSourceItem[]; total: number };
  topDeals: TopDealRow[];
  dealsStatus: {
    total: number;
    weekChange: string;
    segments: { pct: number; segmentClass: string }[];
    items: DealStatusItem[];
  };
  weeklyProfit: {
    labels: string[];
    primary: number[];
    secondary: number[];
  };
  revenueAnalytics: {
    categories: string[];
    sales: number[];
    revenue: number[];
    profit: number[];
  };
  pipelineOverview: {
    categories: string[];
    newLeads: number[];
    emailsSent: number[];
    dealsWon: number[];
  };
  recentContacts: RecentContactRow[];
  stageBreakdown: { stage: string; count: number; badgeClass: string }[];
  assigneeBreakdown: { name: string; active: number; total: number }[];
  topSalts: SaltCategoryRow[];
  pipelineRows: PipelineTableRow[];
  followUpTasks: FollowUpTask[];
};

const OUTREACH_ICON_BGS: RecentOutreachItem["iconBg"][] = [
  "primary",
  "info",
  "warning",
  "danger",
  "success",
  "pinkmain",
];

const AVATAR_CLASSES: TopDealRow["avatarClass"][] = [
  "primary",
  "warning",
  "success",
  "secondary",
  "info",
];

function monthKey(iso: string): string | null {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} mins ago.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hrs ago.`;
  return formatShortDate(iso);
}

function parseDealAmount(value: string): number {
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * 17) % 360;
  return h;
}

function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

function buildSparkline(values: number[], points = 8): number[] {
  if (values.length === 0) return Array(points).fill(0);
  const slice = values.slice(-points);
  while (slice.length < points) slice.unshift(0);
  const max = Math.max(1, ...slice);
  return slice.map((v) => Math.round((v / max) * 100));
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function countByMonthKey<T>(
  items: T[],
  getDate: (item: T) => string,
  key: string
): number {
  return items.filter((item) => monthKey(getDate(item)) === key).length;
}

function buildMonthlyBuckets(count: number): { key: string; label: string }[] {
  const buckets: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    buckets.push({ key, label });
  }
  return buckets;
}

function stageBadgeClass(stage: LeadStage): string {
  if (stage === "Won") return "bg-success/10 text-success";
  if (stage === "Lost") return "bg-danger/10 text-danger";
  if (stage === "Dormant") return "bg-secondary/10 text-secondary";
  if (["Sample Requested", "Quotation Sent", "Negotiation"].includes(stage))
    return "bg-info/10 text-info";
  if (["Intro Email Sent", "Follow-up Sent", "Replied"].includes(stage))
    return "bg-warning/10 text-warning";
  return "bg-primary/10 text-primary";
}

function followUpTargetLabel(iso: string): {
  label: string;
  badgeClass: string;
} {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime()))
    return { label: "Soon", badgeClass: "bg-primary text-white" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) return { label: "Today", badgeClass: "bg-primary text-white" };
  if (diff === 1)
    return { label: "Tomorrow", badgeClass: "bg-secondary text-white" };
  return {
    label: formatShortDate(iso),
    badgeClass: "bg-warning text-white",
  };
}

function buildRevenueAnalytics(emails: CrmEmail[], leads: CrmLead[]) {
  const buckets = buildMonthlyBuckets(12);
  const sentMap = new Map(buckets.map((b) => [b.key, 0]));
  const replyMap = new Map(buckets.map((b) => [b.key, 0]));
  const wonMap = new Map(buckets.map((b) => [b.key, 0]));

  for (const email of emails) {
    const key = monthKey(email.sentAt);
    if (!key || !sentMap.has(key)) continue;
    if (email.direction === "outbound") {
      sentMap.set(key, (sentMap.get(key) ?? 0) + 1);
    } else {
      replyMap.set(key, (replyMap.get(key) ?? 0) + 1);
    }
  }

  for (const lead of leads) {
    if (lead.stage !== "Won") continue;
    const key = monthKey(lead.createdAt);
    if (!key || !wonMap.has(key)) continue;
    wonMap.set(key, (wonMap.get(key) ?? 0) + 1);
  }

  return {
    categories: buckets.map((b) => b.label),
    sales: buckets.map((b) => sentMap.get(b.key) ?? 0),
    revenue: buckets.map((b) => replyMap.get(b.key) ?? 0),
    profit: buckets.map((b) => wonMap.get(b.key) ?? 0),
  };
}

function buildPipelineOverview(leads: CrmLead[], emails: CrmEmail[]) {
  const buckets = buildMonthlyBuckets(12);
  const leadMap = new Map(buckets.map((b) => [b.key, 0]));
  const emailMap = new Map(buckets.map((b) => [b.key, 0]));
  const wonMap = new Map(buckets.map((b) => [b.key, 0]));

  for (const lead of leads) {
    const key = monthKey(lead.createdAt);
    if (key && leadMap.has(key)) leadMap.set(key, (leadMap.get(key) ?? 0) + 1);
    if (lead.stage === "Won") {
      const wk = monthKey(lead.lastActivity || lead.createdAt);
      if (wk && wonMap.has(wk)) wonMap.set(wk, (wonMap.get(wk) ?? 0) + 1);
    }
  }
  for (const email of emails) {
    if (email.direction !== "outbound") continue;
    const key = monthKey(email.sentAt);
    if (key && emailMap.has(key))
      emailMap.set(key, (emailMap.get(key) ?? 0) + 1);
  }

  return {
    categories: buckets.map((b) => b.label),
    newLeads: buckets.map((b) => leadMap.get(b.key) ?? 0),
    emailsSent: buckets.map((b) => emailMap.get(b.key) ?? 0),
    dealsWon: buckets.map((b) => wonMap.get(b.key) ?? 0),
  };
}

function buildWeeklyProfit(leads: CrmLead[], emails: CrmEmail[]) {
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  const leadActivity = [0, 0, 0, 0, 0, 0, 0];
  const emailActivity = [0, 0, 0, 0, 0, 0, 0];

  const bump = (iso: string, bucket: number[]) => {
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return;
    bucket[d.getDay()] += 1;
  };

  for (const lead of leads) bump(lead.createdAt, leadActivity);
  for (const email of emails) bump(email.sentAt, emailActivity);

  return { labels, primary: leadActivity, secondary: emailActivity };
}

function buildTopDeals(leads: CrmLead[], deals: CrmDeal[]): TopDealRow[] {
  if (deals.length > 0) {
    return [...deals]
      .sort((a, b) => parseDealAmount(b.value) - parseDealAmount(a.value))
      .slice(0, 5)
      .map((d, idx) => {
        const lead = leads.find((l) => l.id === d.leadId);
        const name = lead?.contactName ?? d.companyName;
        const email = lead?.contactEmail ?? "—";
        return {
          id: d.id,
          name,
          email,
          amount: d.value.startsWith("$") ? d.value : `$${d.value}`,
          initials: initials(name),
          avatarHue: hueFromString(name),
          avatarClass: AVATAR_CLASSES[idx % AVATAR_CLASSES.length],
        };
      });
  }

  return [...leads]
    .filter((l) => l.stage === "Won" || l.leadScore > 0)
    .sort((a, b) => b.leadScore - a.leadScore)
    .slice(0, 5)
    .map((l, idx) => ({
      id: l.id,
      name: l.contactName,
      email: l.contactEmail,
      amount: `Score ${l.leadScore}`,
      initials: initials(l.contactName),
      avatarHue: hueFromString(l.contactName),
      avatarClass: AVATAR_CLASSES[idx % AVATAR_CLASSES.length],
    }));
}

export function buildReportsSnapshot(
  leads: CrmLead[],
  companies: CrmCompany[],
  contacts: CrmContact[],
  emails: CrmEmail[],
  deals: CrmDeal[],
  timeline: CrmTimelineEvent[]
): ReportsSnapshot {
  const outbound = emails.filter((e) => e.direction === "outbound").length;
  const inbound = emails.filter((e) => e.direction === "inbound").length;
  const won = leads.filter((l) => l.stage === "Won").length;
  const lost = leads.filter((l) => l.stage === "Lost").length;
  const activeLeads = leads.filter((l) => !isTerminalStage(l.stage)).length;
  const closed = won + lost;
  const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0;
  const replyRate = outbound > 0 ? Math.round((inbound / outbound) * 100) : 0;

  const verifiedPlus = leads.filter(
    (l) =>
      !["Saved"].includes(l.stage) &&
      l.stage !== "Lost" &&
      l.stage !== "Dormant"
  ).length;
  const targetPercent =
    leads.length > 0 ? Math.round((verifiedPlus / leads.length) * 100) : 0;

  const monthlySent = buildMonthlyBuckets(8).map((b) =>
    emails.filter(
      (e) => e.direction === "outbound" && monthKey(e.sentAt) === b.key
    ).length
  );
  const monthlyReplies = buildMonthlyBuckets(8).map((b) =>
    emails.filter(
      (e) => e.direction === "inbound" && monthKey(e.sentAt) === b.key
    ).length
  );
  const monthlyLeads = buildMonthlyBuckets(8).map((b) =>
    leads.filter((l) => monthKey(l.createdAt) === b.key).length
  );
  const monthlyDeals = buildMonthlyBuckets(8).map((b) =>
    deals.filter((d) => monthKey(d.createdAt) === b.key).length
  );
  const monthlyContacts = buildMonthlyBuckets(8).map((b) =>
    contacts.filter((c) => monthKey(c.createdAt) === b.key).length
  );
  const monthlyCompanies = buildMonthlyBuckets(8).map((b) =>
    companies.filter((c) => monthKey(c.createdAt) === b.key).length
  );

  const thisMonth = currentMonthKey();
  const lastMonth = previousMonthKey();

  const leadsThisMonth = countByMonthKey(leads, (l) => l.createdAt, thisMonth);
  const leadsLastMonth = countByMonthKey(leads, (l) => l.createdAt, lastMonth);
  const outboundThisMonth = countByMonthKey(
    emails.filter((e) => e.direction === "outbound"),
    (e) => e.sentAt,
    thisMonth
  );
  const outboundLastMonth = countByMonthKey(
    emails.filter((e) => e.direction === "outbound"),
    (e) => e.sentAt,
    lastMonth
  );
  const inboundThisMonth = countByMonthKey(
    emails.filter((e) => e.direction === "inbound"),
    (e) => e.sentAt,
    thisMonth
  );
  const inboundLastMonth = countByMonthKey(
    emails.filter((e) => e.direction === "inbound"),
    (e) => e.sentAt,
    lastMonth
  );
  const replyRateThisMonth =
    outboundThisMonth > 0
      ? Math.round((inboundThisMonth / outboundThisMonth) * 100)
      : 0;
  const replyRateLastMonth =
    outboundLastMonth > 0
      ? Math.round((inboundLastMonth / outboundLastMonth) * 100)
      : 0;
  const wonThisMonth = leads.filter(
    (l) => l.stage === "Won" && monthKey(l.lastActivity || l.createdAt) === thisMonth
  ).length;
  const wonLastMonth = leads.filter(
    (l) => l.stage === "Won" && monthKey(l.lastActivity || l.createdAt) === lastMonth
  ).length;
  const contactsThisMonth = countByMonthKey(
    contacts,
    (c) => c.createdAt,
    thisMonth
  );
  const contactsLastMonth = countByMonthKey(
    contacts,
    (c) => c.createdAt,
    lastMonth
  );
  const dealsThisMonth = countByMonthKey(deals, (d) => d.createdAt, thisMonth);
  const dealsLastMonth = countByMonthKey(deals, (d) => d.createdAt, lastMonth);

  const verifiedThisMonth = leads.filter(
    (l) =>
      !["Saved"].includes(l.stage) &&
      l.stage !== "Lost" &&
      l.stage !== "Dormant" &&
      monthKey(l.createdAt) === thisMonth
  ).length;
  const verifiedLastMonth = leads.filter(
    (l) =>
      !["Saved"].includes(l.stage) &&
      l.stage !== "Lost" &&
      l.stage !== "Dormant" &&
      monthKey(l.createdAt) === lastMonth
  ).length;
  const conversionThisMonth =
    leadsThisMonth > 0
      ? Math.round((verifiedThisMonth / leadsThisMonth) * 100)
      : 0;
  const conversionLastMonth =
    leadsLastMonth > 0
      ? Math.round((verifiedLastMonth / leadsLastMonth) * 100)
      : 0;

  const activeLeadsChange = pctChange(leadsThisMonth, leadsLastMonth);
  const emailsSentChange = pctChange(outboundThisMonth, outboundLastMonth);
  const replyRateChange = replyRateThisMonth - replyRateLastMonth;
  const wonDealsChange = pctChange(wonThisMonth, wonLastMonth);

  const salesStats: SalesStatCard[] = [
    {
      id: "active-leads",
      title: "Active Leads",
      value: formatCount(activeLeads),
      period: "IN PIPELINE",
      change: activeLeadsChange,
      changePositive: activeLeadsChange >= 0,
      href: "/active-leads",
      icon: "ri-pulse-line",
    },
    {
      id: "emails-sent",
      title: "Emails Sent",
      value: formatCount(outbound),
      period: "OUTREACH",
      change: emailsSentChange,
      changePositive: emailsSentChange >= 0,
      href: "/inbox",
      icon: "ri-mail-send-line",
    },
    {
      id: "reply-rate",
      title: "Reply Rate",
      value: `${replyRate}%`,
      period: "ENGAGEMENT",
      change: replyRateChange,
      changePositive: replyRateChange >= 0,
      href: "/inbox",
      icon: "ri-reply-line",
    },
    {
      id: "won-deals",
      title: "Won Deals",
      value: formatCount(won),
      period: "CLOSED WON",
      change: wonDealsChange,
      changePositive: wonDealsChange >= 0,
      href: "/active-leads",
      icon: "ri-trophy-line",
    },
  ];

  const metricCards: MetricCardData[] = [
    {
      id: "contacts",
      label: "Total Customers",
      value: formatCount(contacts.length),
      change: pctChange(contactsThisMonth, contactsLastMonth),
      changeLabel: "this month",
      iconBg: "primary",
      linkClass: "text-primary",
      icon: "ti ti-users",
      sparkColor: DASHBOARD_COLORS.purple,
      sparkline: buildSparkline(monthlyContacts),
    },
    {
      id: "companies",
      label: "Total Companies",
      value: formatCount(companies.length),
      change: pctChange(
        countByMonthKey(companies, (c) => c.createdAt, thisMonth),
        countByMonthKey(companies, (c) => c.createdAt, lastMonth)
      ),
      changeLabel: "this month",
      iconBg: "secondary",
      linkClass: "text-secondary",
      icon: "ti ti-building",
      sparkColor: DASHBOARD_COLORS.teal,
      sparkline: buildSparkline(monthlyCompanies),
    },
    {
      id: "conversion",
      label: "Conversion Ratio",
      value: `${targetPercent.toFixed(2)}%`,
      change: conversionThisMonth - conversionLastMonth,
      changeLabel: "this month",
      iconBg: "success",
      linkClass: "text-success",
      icon: "ti ti-wave-square",
      sparkColor: DASHBOARD_COLORS.green,
      sparkline: buildSparkline(monthlyReplies),
    },
    {
      id: "deals",
      label: "Total Deals",
      value: formatCount(Math.max(deals.length, activeLeads)),
      change: pctChange(dealsThisMonth, dealsLastMonth),
      changeLabel: "this month",
      iconBg: "warning",
      linkClass: "text-warning",
      icon: "ti ti-briefcase",
      sparkColor: DASHBOARD_COLORS.yellow,
      sparkline: buildSparkline(
        monthlyDeals.some((v) => v > 0) ? monthlyDeals : monthlyLeads
      ),
    },
  ];

  const recentOutreach: RecentOutreachItem[] = [...emails]
    .sort(
      (a, b) =>
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    )
    .slice(0, 6)
    .map((email, i) => {
      const lead = email.leadId
        ? leads.find((l) => l.id === email.leadId)
        : null;
      const inbound = email.direction === "inbound";
      return {
        id: email.id,
        title: lead?.companyName ?? email.subject.slice(0, 40),
        subtitle: inbound ? "Reply received" : "Email sent",
        amount: inbound ? `+${lead?.leadScore ?? 1} pt` : "Sent",
        amountPositive: inbound,
        date: formatShortDate(email.sentAt),
        iconBg: OUTREACH_ICON_BGS[i % OUTREACH_ICON_BGS.length],
      };
    });

  const activities: ActivityItem[] = [...timeline]
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 6)
    .map((ev) => ({
      id: ev.id,
      highlight: ev.title,
      text: ev.description,
      time: formatTimeAgo(ev.date),
      tone:
        ev.type === "deal"
          ? "success"
          : ev.type === "email"
            ? "primary"
            : ev.type === "stage"
              ? "warning"
              : "danger",
    }));

  const sourceMeta = [
    {
      label: "Discovery",
      legendClass: "mobile" as const,
      color: DASHBOARD_COLORS.purple,
    },
    {
      label: "Email",
      legendClass: "desktop" as const,
      color: DASHBOARD_COLORS.teal,
    },
    {
      label: "Sample",
      legendClass: "laptop" as const,
      color: DASHBOARD_COLORS.yellow,
    },
    {
      label: "Close",
      legendClass: "tablet" as const,
      color: DASHBOARD_COLORS.green,
    },
  ];
  const sourceCounts = [
    leads.filter((l) => ["Saved", "Verified"].includes(l.stage)).length,
    leads.filter((l) =>
      ["Intro Email Sent", "Follow-up Sent", "Replied"].includes(l.stage)
    ).length,
    leads.filter((l) =>
      ["Sample Requested", "Quotation Sent"].includes(l.stage)
    ).length,
    leads.filter((l) =>
      ["Negotiation", "Won", "Lost", "Dormant"].includes(l.stage)
    ).length,
  ];
  const sourceGroups: LeadSourceItem[] = sourceMeta.map((m, i) => ({
    ...m,
    count: sourceCounts[i],
  }));

  const successful = won;
  const pending = leads.filter(
    (l) =>
      !isTerminalStage(l.stage) &&
      !["Saved", "Verified"].includes(l.stage)
  ).length;
  const rejected = lost;
  const upcoming = leads.filter((l) =>
    ["Saved", "Dormant"].includes(l.stage)
  ).length;

  const statusItems: DealStatusItem[] = [
    {
      label: "Successful Deals",
      count: successful,
      statusClass: "primary",
      segmentClass: "bg-primary",
    },
    {
      label: "Pending Deals",
      count: pending,
      statusClass: "info",
      segmentClass: "bg-info",
    },
    {
      label: "Rejected Deals",
      count: rejected,
      statusClass: "warning",
      segmentClass: "bg-warning",
    },
    {
      label: "Upcoming Deals",
      count: upcoming,
      statusClass: "success",
      segmentClass: "bg-success",
    },
  ];

  const statusTotal = statusItems.reduce((s, i) => s + i.count, 0);
  const segments =
    statusTotal === 0
      ? statusItems.map((i) => ({
          pct: 0,
          segmentClass: i.segmentClass,
        }))
      : statusItems.map((i) => ({
          pct: Math.round((i.count / statusTotal) * 100),
          segmentClass: i.segmentClass,
        }));

  const saltMap = new Map<string, number>();
  for (const lead of leads) {
    saltMap.set(lead.matchedSalt, (saltMap.get(lead.matchedSalt) ?? 0) + 1);
  }
  const maxSalt = Math.max(1, ...saltMap.values());
  const topSalts: SaltCategoryRow[] = [...saltMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / maxSalt) * 100),
    }));

  const assigneeMap = new Map<string, { active: number; total: number }>();
  for (const lead of leads) {
    const cur = assigneeMap.get(lead.assignedTo) ?? { active: 0, total: 0 };
    cur.total += 1;
    if (!isTerminalStage(lead.stage)) cur.active += 1;
    assigneeMap.set(lead.assignedTo, cur);
  }
  const assigneeBreakdown = [...assigneeMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.active - a.active);

  const stageBreakdown = LEAD_STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => l.stage === stage).length,
    badgeClass: stageBadgeClass(stage),
  })).filter((s) => s.count > 0);

  const recentContacts: RecentContactRow[] = [...contacts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 6)
    .map((c, idx) => ({
      id: c.id,
      name: c.name,
      subtitle: c.role,
      time: formatShortDate(c.createdAt),
      initials: initials(c.name),
      avatarClass: AVATAR_CLASSES[idx % AVATAR_CLASSES.length],
    }));

  const pipelineRows: PipelineTableRow[] = [...leads]
    .filter((l) => !isTerminalStage(l.stage))
    .sort((a, b) => b.leadScore - a.leadScore)
    .slice(0, 8)
    .map((l) => ({
      id: l.id,
      leadId: l.id,
      company: l.companyName,
      contact: l.contactName,
      salt: l.matchedSalt,
      stage: l.stage,
      stageBadgeClass: stageBadgeClass(l.stage),
      assignee: l.assignedTo,
      assigneeInitials: initials(l.assignedTo),
      date: formatShortDate(l.lastActivity || l.createdAt),
      score: l.leadScore,
    }));

  const followUpTasks: FollowUpTask[] = [...leads]
    .filter((l) => l.followUpDate)
    .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))
    .slice(0, 12)
    .map((l) => {
      const target = followUpTargetLabel(l.followUpDate);
      return {
        id: l.id,
        leadId: l.id,
        detail: `${l.companyName} — ${l.matchedSalt} (${l.stage})`,
        assignedDate: formatShortDate(l.lastActivity || l.createdAt),
        target: target.label,
        targetBadgeClass: target.badgeClass,
        assignee: l.assignedTo,
        assigneeInitials: initials(l.assignedTo),
        completed: isTerminalStage(l.stage),
      };
    });

  return {
    targetPercent,
    winRate,
    replyRate,
    salesStats,
    metricCards,
    recentOutreach,
    activities,
    leadsBySource: { items: sourceGroups, total: leads.length },
    topDeals: buildTopDeals(leads, deals),
    dealsStatus: {
      total: statusTotal,
      weekChange: `${winRate >= 0 ? "+" : ""}${winRate}%`,
      segments,
      items: statusItems,
    },
    weeklyProfit: buildWeeklyProfit(leads, emails),
    revenueAnalytics: buildRevenueAnalytics(emails, leads),
    pipelineOverview: buildPipelineOverview(leads, emails),
    recentContacts,
    stageBreakdown,
    assigneeBreakdown,
    topSalts,
    pipelineRows,
    followUpTasks,
  };
}
