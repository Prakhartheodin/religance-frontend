"use client";

import { isAuthed, getUser, getUserDisplayName } from "@/shared/auth/auth-client";
import type { CompanyProfileDetail } from "@/shared/crm/lead-discovery/company-profile-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyTemplate,
  cloneDefaultEmailTemplates,
  createBlankEmailTemplate,
  getDefaultEmailTemplate,
  isDefaultEmailTemplate,
  type EmailTemplate,
  type TemplateVariables,
} from "./email-templates";
import {
  createBlankMedicine,
  type DiscoveryMedicine,
} from "./medicines-master";
import { createBlankSalt, type SaltMasterItem } from "./salts-master";
import {
  createBackendMedicine,
  createBackendSalt,
  getBackendMedicines,
  getBackendSalts,
  patchBackendMedicine,
  patchBackendSalt,
  removeBackendMedicine,
  removeBackendSalt,
} from "./catalogue-api";
import { createInitialCrmState } from "./seed";
import type {
  CrmCompany,
  CrmContact,
  CrmEmail,
  CrmEmailMeta,
  CrmLead,
  CrmState,
  CrmTimelineEvent,
  EmailFlag,
  LeadStage,
  SaveToContactOption,
} from "./types";
import {
  buildLeadTitle,
  followUpInDays,
  generateCrmId,
  getNextLeadStage,
  optionCreatesContact,
  optionCreatesLead,
  primaryContactFromProfile,
  stageAfterSendEmail,
  todayIso,
} from "./workflow";
import {
  fetchOutlookConnectUrl,
  disconnectOutlookAccount as disconnectOutlookAccountApi,
  getOutlookThread,
  listOutlookAccounts,
  listOutlookThreads,
  type OutlookAccount,
  type OutlookThreadItem,
  sendOutlookMessage,
  replyOutlookMessage,
  replyAllOutlookMessage,
  forwardOutlookMessage,
  batchModifyOutlookThreads,
  trashOutlookThreads,
} from "./outlook-api";
import { getBackendContacts, saveBackendContacts } from "./contacts-api";
import { getBackendCompanies, saveBackendCompanies } from "./companies-api";
import { getBackendEmailMeta, saveBackendEmailMeta } from "./emails-api";
import { getBackendLeads, saveBackendLeads } from "./leads-api";
import { getBackendDeals, saveBackendDeals } from "./deals-api";
import { getBackendTimeline, saveBackendTimeline } from "./timeline-api";
import {
  getBackendEmailTemplates,
  saveBackendEmailTemplates,
} from "./templates-api";

export type SaveFromDiscoveryInput = {
  profile: CompanyProfileDetail;
  option: SaveToContactOption;
  contactIndex?: number;
};

export type SendLeadEmailInput = {
  leadId: string;
  templateId: string;
  subject: string;
  body: string;
};

export type SendCrmEmailInput = {
  leadId?: string | null;
  toEmail: string;
  subject: string;
  body: string;
  /** Outlook message id to thread against. Only synced emails have one. */
  replyToMessageId?: string | null;
  mode?: "reply" | "replyAll" | "forward";
};

type CrmContextValue = CrmState & {
  hydrated: boolean;
  masterDataSynced: boolean;
  saveFromDiscovery: (input: SaveFromDiscoveryInput) => {
    companyId: string;
    contactId: string | null;
    leadId: string | null;
    openCompose: boolean;
  };
  createLeadManual: (input: Omit<CrmLead, "id" | "createdAt" | "lastActivity" | "sourceLinks"> & {
    sourceLinks?: CrmLead["sourceLinks"];
  }) => string;
  updateLead: (leadId: string, patch: Partial<CrmLead>) => void;
  setLeadStage: (leadId: string, stage: LeadStage) => void;
  advanceLeadStage: (leadId: string) => void;
  verifyLead: (leadId: string) => void;
  markLeadLost: (leadId: string) => void;
  markLeadDormant: (leadId: string) => void;
  createDealFromLead: (leadId: string, value?: string) => string | null;
  sendLeadEmail: (input: SendLeadEmailInput) => void;
  /** Resolves to null on success, or an error message if the send failed. */
  sendCrmEmail: (input: SendCrmEmailInput) => Promise<string | null>;
  linkEmailToLead: (emailId: string, leadId: string) => void;
  /** Star / read / archive / trash. Persisted, so it survives a reload. */
  setEmailFlag: (emailId: string, flag: EmailFlag, on: boolean) => void;
  emailIdsWithFlag: (flag: EmailFlag) => string[];
  connectGmail: () => Promise<void>;
  disconnectOutlook: (accountId?: string | null) => Promise<void>;
  syncOutlookInbox: (
    preferredAccountId?: string | null,
    preferredEmail?: string | null
  ) => Promise<void>;
  switchOutlookAccount: (accountId: string) => Promise<void>;
  getCompany: (id: string) => CrmCompany | undefined;
  getContact: (id: string) => CrmContact | undefined;
  deleteContact: (id: string) => void;
  getLead: (id: string) => CrmLead | undefined;
  getLeadEmails: (leadId: string) => CrmEmail[];
  getLeadTimeline: (leadId: string) => CrmTimelineEvent[];
  findCompanyByDiscoveryId: (discoveryId: string) => CrmCompany | undefined;
  buildTemplateVars: (lead: CrmLead) => TemplateVariables;
  updateEmailTemplate: (
    id: string,
    patch: Partial<Omit<EmailTemplate, "id">>
  ) => void;
  replaceEmailTemplates: (templates: EmailTemplate[]) => void;
  addEmailTemplate: () => string;
  deleteEmailTemplate: (id: string) => void;
  resetEmailTemplate: (id: string) => void;
  resetAllEmailTemplates: () => void;
  /** Shared catalogue: every edit is a per-item server call. */
  addSalt: () => Promise<string | null>;
  updateSalt: (
    id: string,
    patch: Partial<Omit<SaltMasterItem, "id">>
  ) => Promise<boolean>;
  deleteSalt: (id: string) => Promise<boolean>;
  addMedicine: (saltId?: string) => Promise<string | null>;
  updateMedicine: (
    id: string,
    patch: Partial<Omit<DiscoveryMedicine, "id">>
  ) => Promise<boolean>;
  deleteMedicine: (id: string) => Promise<boolean>;
  pendingComposeLeadId: string | null;
  setPendingComposeLeadId: (id: string | null) => void;
  resetStore: () => void;
};

const CrmContext = createContext<CrmContextValue | null>(null);

function appendTimeline(
  timeline: CrmTimelineEvent[],
  event: Omit<CrmTimelineEvent, "id">
): CrmTimelineEvent[] {
  return [{ ...event, id: generateCrmId("tl") }, ...timeline];
}

function extractEmailAddress(raw: string): string {
  const s = String(raw || "").trim();
  const m = s.match(/<([^>]+)>/);
  return (m ? m[1] : s).trim().toLowerCase();
}

/**
 * Graph re-sends every email with leadId: null on each sync, so the CRM's own
 * overlay has to be re-applied afterwards or the user's lead links vanish.
 */
function applyEmailMeta(emails: CrmEmail[], meta: CrmEmailMeta[]): CrmEmail[] {
  if (!meta.length) return emails;
  const byId = new Map(meta.map((m) => [m.id, m]));
  return emails.map((e) => {
    const m = byId.get(e.id);
    return m ? { ...e, leadId: m.leadId } : e;
  });
}

function upsertEmailMeta(
  meta: CrmEmailMeta[],
  id: string,
  patchMeta: Partial<Omit<CrmEmailMeta, "id">>
): CrmEmailMeta[] {
  const existing = meta.find((m) => m.id === id);
  if (existing) {
    return meta.map((m) => (m.id === id ? { ...m, ...patchMeta } : m));
  }
  return [
    ...meta,
    {
      id,
      leadId: null,
      starred: false,
      read: false,
      archived: false,
      trashed: false,
      ...patchMeta,
    },
  ];
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CrmState>(createInitialCrmState);
  const [hydrated, setHydrated] = useState(false);
  const importedMasterLoadedRef = useRef(false);
  const crmLoadedRef = useRef(false);
  const crmSyncedRef = useRef(false);
  // The ids each entity was authoritative about at last sync (loaded + created).
  // Sent with every save so the server scopes deletes to these — a stale second
  // tab can't delete a record another tab created that it never loaded.
  const baseIdsRef = useRef<
    Record<
      "companies" | "contacts" | "leads" | "deals" | "timeline" | "emailMeta",
      string[]
    >
  >({
    companies: [],
    contacts: [],
    leads: [],
    deals: [],
    timeline: [],
    emailMeta: [],
  });
  const templatesLoadedRef = useRef(false);
  const templatesSyncedRef = useRef(false);
  const authUserRef = useRef(getUser()?.id ?? "");
  const outlookAccountIdRef = useRef<string | null | undefined>(null);
  const outlookSyncSeqRef = useRef(0);
  const [authUserId, setAuthUserId] = useState(getUser()?.id ?? "");
  const [masterDataSynced, setMasterDataSynced] = useState(false);
  const [pendingComposeLeadId, setPendingComposeLeadId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const initial = createInitialCrmState();
    if (isAuthed()) {
      initial.salts = [];
      initial.medicines = [];
    }
    setState(initial);
    setHydrated(true);
    authUserRef.current = getUser()?.id ?? "";
    setAuthUserId(authUserRef.current);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    // Nothing is cached client-side: dropping to the seed state and letting the
    // Mongo sync effects re-run is the whole of "switch user".
    const reloadForAuthUser = () => {
      const nextUserId = getUser()?.id ?? "";
      if (nextUserId === authUserRef.current) return;
      authUserRef.current = nextUserId;

      const next = createInitialCrmState();
      if (nextUserId) {
        next.salts = [];
        next.medicines = [];
      }
      setState(next);

      importedMasterLoadedRef.current = false;
      crmLoadedRef.current = false;
      crmSyncedRef.current = false;
      baseIdsRef.current = {
        companies: [],
        contacts: [],
        leads: [],
        deals: [],
        timeline: [],
        emailMeta: [],
      };
      templatesLoadedRef.current = false;
      templatesSyncedRef.current = false;
      setMasterDataSynced(false);
      setAuthUserId(nextUserId);
    };

    window.addEventListener("religence-auth-change", reloadForAuthUser);
    return () => window.removeEventListener("religence-auth-change", reloadForAuthUser);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || importedMasterLoadedRef.current) return;
    importedMasterLoadedRef.current = true;
    let active = true;

    // The salt/medicine catalogue is SHARED and read-only from here. Mongo is the
    // source of truth; the client never writes the whole list back.
    //
    // This used to GET the catalogue, setState it, and then a debounced effect
    // PUT the entire array straight back — so every login by every user rewrote
    // the same 10 rows under their own userId. That is where the duplicate
    // documents came from. Edits now go through per-item POST/PATCH/DELETE.
    const syncMasterData = async () => {
      if (!isAuthed()) return;

      const [saltsRes, medsRes] = await Promise.all([
        getBackendSalts(),
        getBackendMedicines(),
      ]);
      if (!active) return;
      if (!saltsRes.live || !medsRes.live) return;

      setState((prev) => ({
        ...prev,
        salts: saltsRes.data,
        medicines: medsRes.data,
      }));
      setMasterDataSynced(true);
    };

    void syncMasterData();
    return () => {
      active = false;
    };
  }, [hydrated, authUserId]);

  // Mongo is the source of truth for the CRM entities
  // (companies/contacts/leads/deals/timeline). Each has its own model/service;
  // pull all five once on hydrate. If a user has no server doc for an entity
  // yet, seed it from whatever is in local state.
  useEffect(() => {
    if (!hydrated || crmLoadedRef.current) return;
    crmLoadedRef.current = true;
    let active = true;

    const syncCrm = async () => {
      const [companiesRes, contactsRes, leadsRes, dealsRes, timelineRes, emailMetaRes] =
        await Promise.all([
          getBackendCompanies(),
          getBackendContacts(),
          getBackendLeads(),
          getBackendDeals(),
          getBackendTimeline(),
          getBackendEmailMeta(),
        ]);
      if (!active) return;

      // If ANY GET failed, do nothing at all: keep whatever is on screen, and
      // leave crmSyncedRef false so the debounced save effects stay disarmed.
      // Substituting [] here (as this code used to) meant a single timeout could
      // PUT an empty array over the user's entire CRM.
      const allLive =
        companiesRes.live &&
        contactsRes.live &&
        leadsRes.live &&
        dealsRes.live &&
        timelineRes.live &&
        emailMetaRes.live;
      if (!allLive) return;

      const companies = companiesRes.live ? companiesRes.data : [];
      const contacts = contactsRes.live ? contactsRes.data : [];
      const leads = leadsRes.live ? leadsRes.data : [];
      const deals = dealsRes.live ? dealsRes.data : [];
      const timeline = timelineRes.live ? timelineRes.data : [];
      const emailMeta = emailMetaRes.live ? emailMetaRes.data : [];

      setState((prev) => ({
        ...prev,
        companies,
        contacts,
        leads,
        deals,
        timeline,
        emailMeta,
        // Re-apply the overlay to whatever Outlook already synced into `emails`.
        emails: applyEmailMeta(prev.emails, emailMeta),
      }));
      baseIdsRef.current = {
        companies: companies.map((c) => c.id),
        contacts: contacts.map((c) => c.id),
        leads: leads.map((l) => l.id),
        deals: deals.map((d) => d.id),
        timeline: timeline.map((t) => t.id),
        emailMeta: emailMeta.map((e) => e.id),
      };
      crmSyncedRef.current = true;
    };

    void syncCrm();
    return () => {
      active = false;
    };
  }, [hydrated, authUserId]);

  // Email templates: Mongo is the source of truth. Pull once on hydrate; if the
  // user has no server doc yet, seed it from the defaults already in state.
  useEffect(() => {
    if (!hydrated || templatesLoadedRef.current) return;
    templatesLoadedRef.current = true;
    let active = true;

    const syncTemplates = async () => {
      const res = await getBackendEmailTemplates();
      if (!active) return;

      // Never arm the template save-effect on a failed GET: state still holds
      // cloneDefaultEmailTemplates(), and the next edit would PUT those defaults
      // over the user's customised set.
      if (!res.live) return;

      if (res.data.length) {
        setState((prev) => ({ ...prev, emailTemplates: res.data }));
      } else {
        await saveBackendEmailTemplates(state.emailTemplates);
        if (!active) return;
      }
      templatesSyncedRef.current = true;
    };

    void syncTemplates();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, authUserId]);

  useEffect(() => {
    if (!templatesSyncedRef.current) return;
    const t = window.setTimeout(
      () => void saveBackendEmailTemplates(state.emailTemplates),
      800
    );
    return () => window.clearTimeout(t);
  }, [state.emailTemplates]);

  // Persist entity edits to Mongo (debounced) once the initial sync has run.
  // Sends the current baseIds so the server scopes deletes; on success the ids
  // just written become the new baseline (delete-by-omission still works within
  // this tab, but ids this tab never loaded stay protected).
  const persist = useCallback(
    async <T extends { id: string }>(
      key: keyof typeof baseIdsRef.current,
      items: T[],
      save: (items: T[], baseIds: string[]) => Promise<{ live: boolean }>
    ): Promise<void> => {
      const res = await save(items, baseIdsRef.current[key]);
      if (res.live) baseIdsRef.current[key] = items.map((i) => i.id);
    },
    []
  );

  useEffect(() => {
    if (!crmSyncedRef.current) return;
    const t = window.setTimeout(
      () => void persist("companies", state.companies, saveBackendCompanies),
      800
    );
    return () => window.clearTimeout(t);
  }, [state.companies, persist]);

  useEffect(() => {
    if (!crmSyncedRef.current) return;
    const t = window.setTimeout(
      () => void persist("contacts", state.contacts, saveBackendContacts),
      800
    );
    return () => window.clearTimeout(t);
  }, [state.contacts, persist]);

  useEffect(() => {
    if (!crmSyncedRef.current) return;
    const t = window.setTimeout(
      () => void persist("leads", state.leads, saveBackendLeads),
      800
    );
    return () => window.clearTimeout(t);
  }, [state.leads, persist]);

  useEffect(() => {
    if (!crmSyncedRef.current) return;
    const t = window.setTimeout(
      () => void persist("deals", state.deals, saveBackendDeals),
      800
    );
    return () => window.clearTimeout(t);
  }, [state.deals, persist]);

  useEffect(() => {
    if (!crmSyncedRef.current) return;
    const t = window.setTimeout(
      () => void persist("timeline", state.timeline, saveBackendTimeline),
      800
    );
    return () => window.clearTimeout(t);
  }, [state.timeline, persist]);

  useEffect(() => {
    if (!crmSyncedRef.current) return;
    const t = window.setTimeout(
      () => void persist("emailMeta", state.emailMeta, saveBackendEmailMeta),
      800
    );
    return () => window.clearTimeout(t);
  }, [state.emailMeta, persist]);

  const patch = useCallback((fn: (prev: CrmState) => CrmState) => {
    setState(fn);
  }, []);

  const findCompanyByDiscoveryId = useCallback(
    (discoveryId: string) =>
      state.companies.find((c) => c.discoveryCompanyId === discoveryId),
    [state.companies]
  );

  const saveFromDiscovery = useCallback(
    (input: SaveFromDiscoveryInput) => {
      const { profile, option } = input;
      const contactIdx = input.contactIndex ?? 0;
      const openCompose = option === "create_lead_and_email";
      const result = {
        companyId: "",
        contactId: null as string | null,
        leadId: null as string | null,
        openCompose,
      };

      patch((prev) => {
        const existing = prev.companies.find(
          (c) => c.discoveryCompanyId === profile.id
        );
        let companies = prev.companies;
        let contacts = prev.contacts;
        let leads = prev.leads;
        let timeline = prev.timeline;

        let company: CrmCompany;
        if (existing) {
          company = {
            ...existing,
            location: profile.location,
            website: profile.website,
            companyType: profile.companyType,
            certification: profile.certification,
            sourceLinks: profile.sourceLinks,
          };
          companies = companies.map((c) =>
            c.id === existing.id ? company : c
          );
          result.companyId = company.id;
        } else {
          company = {
            id: generateCrmId("co"),
            name: profile.companyName,
            location: profile.location,
            website: profile.website,
            companyType: profile.companyType,
            certification: profile.certification,
            discoveryCompanyId: profile.id,
            sourceLinks: profile.sourceLinks,
            createdAt: todayIso(),
          };
          companies = [...companies, company];
          result.companyId = company.id;
        }

        if (optionCreatesContact(option)) {
          const pc =
            profile.contacts[contactIdx] ?? primaryContactFromProfile(profile);
          const email = pc.email ?? "";
          const existingCt = contacts.find(
            (c) =>
              c.companyId === company.id &&
              c.email.toLowerCase() === email.toLowerCase()
          );
          if (existingCt) {
            result.contactId = existingCt.id;
          } else {
            const contact: CrmContact = {
              id: generateCrmId("ct"),
              companyId: company.id,
              name: pc.name,
              role: pc.role,
              email,
              phone: pc.phone,
              createdAt: todayIso(),
            };
            contacts = [...contacts, contact];
            result.contactId = contact.id;
          }
        }

        if (optionCreatesLead(option)) {
          const pc =
            profile.contacts[contactIdx] ?? primaryContactFromProfile(profile);
          const existingLead = leads.find(
            (l) => l.discoveryCompanyId === profile.id
          );
          if (existingLead) {
            result.leadId = existingLead.id;
          } else {
          const lead: CrmLead = {
            id: generateCrmId("lead"),
            title: buildLeadTitle(profile, profile.companyName),
            companyId: company.id,
            contactId: result.contactId,
            discoveryCompanyId: profile.id,
            companyName: profile.companyName,
            contactName: pc.name,
            contactRole: pc.role,
            contactEmail: pc.email ?? "",
            matchedSalt: profile.matchedSalt,
            matchedMedicine: profile.matchedMedicine,
            dosageForm: profile.dosageForm,
            location: profile.location,
            stage: "Saved",
            leadScore: profile.leadScore,
            assignedTo: getUserDisplayName(),
            followUpDate: followUpInDays(7),
            lastActivity: todayIso(),
            notes: profile.aiNotes,
            createdAt: todayIso(),
            sourceLinks: profile.sourceLinks,
          };
          leads = [...leads, lead];
          result.leadId = lead.id;
          timeline = appendTimeline(timeline, {
            leadId: lead.id,
            date: todayIso(),
            title: "Lead created from discovery",
            description: `Saved via Lead Discovery (${option.replace(/_/g, " ")}).`,
            type: "stage",
          });
          }
        }

        return { ...prev, companies, contacts, leads, timeline };
      });

      if (openCompose && result.leadId) {
        setPendingComposeLeadId(result.leadId);
      }

      return result;
    },
    [patch]
  );

  const createLeadManual = useCallback(
    (input: Parameters<CrmContextValue["createLeadManual"]>[0]) => {
      const id = generateCrmId("lead");
      patch((prev) => {
        const lead: CrmLead = {
          ...input,
          id,
          sourceLinks: input.sourceLinks ?? [],
          createdAt: todayIso(),
          lastActivity: todayIso(),
          stage: input.stage ?? "Saved",
        };
        return {
          ...prev,
          leads: [...prev.leads, lead],
          timeline: appendTimeline(prev.timeline, {
            leadId: id,
            date: todayIso(),
            title: "Lead created manually",
            description: "Added from Active Leads.",
            type: "stage",
          }),
        };
      });
      return id;
    },
    [patch]
  );

  const updateLead = useCallback(
    (leadId: string, patchLead: Partial<CrmLead>) => {
      patch((prev) => ({
        ...prev,
        leads: prev.leads.map((l) =>
          l.id === leadId
            ? { ...l, ...patchLead, lastActivity: todayIso() }
            : l
        ),
      }));
    },
    [patch]
  );

  const deleteContact = useCallback(
    (id: string) => {
      patch((prev) => ({
        ...prev,
        contacts: prev.contacts.filter((c) => c.id !== id),
        leads: prev.leads.map((l) =>
          l.contactId === id ? { ...l, contactId: null } : l
        ),
      }));
    },
    [patch]
  );

  const setLeadStage = useCallback(
    (leadId: string, stage: LeadStage) => {
      patch((prev) => {
        const lead = prev.leads.find((l) => l.id === leadId);
        if (!lead || lead.stage === stage) return prev;
        let deals = prev.deals;
        if (stage === "Won" && !prev.deals.some((d) => d.leadId === leadId)) {
          deals = [
            ...deals,
            {
              id: generateCrmId("deal"),
              leadId,
              title: `${lead.matchedMedicine} — supply agreement`,
              companyName: lead.companyName,
              value: "TBD",
              stage: "Won",
              createdAt: todayIso(),
            },
          ];
        }
        return {
          ...prev,
          leads: prev.leads.map((l) =>
            l.id === leadId ? { ...l, stage, lastActivity: todayIso() } : l
          ),
          deals,
          timeline: appendTimeline(prev.timeline, {
            leadId,
            date: todayIso(),
            title: `Stage: ${stage}`,
            description: `Lead moved to ${stage}.`,
            type: "stage",
          }),
        };
      });
    },
    [patch]
  );

  const advanceLeadStage = useCallback(
    (leadId: string) => {
      const lead = state.leads.find((l) => l.id === leadId);
      if (!lead) return;
      const next = getNextLeadStage(lead.stage);
      if (next) setLeadStage(leadId, next);
    },
    [state.leads, setLeadStage]
  );

  const verifyLead = useCallback(
    (leadId: string) => {
      patch((prev) => ({
        ...prev,
        leads: prev.leads.map((l) =>
          l.id === leadId && l.stage === "Saved"
            ? { ...l, stage: "Verified", lastActivity: todayIso() }
            : l
        ),
        timeline: appendTimeline(prev.timeline, {
          leadId,
          date: todayIso(),
          title: "Lead verified",
          description: "Approved in Verification Queue.",
          type: "verification",
        }),
      }));
    },
    [patch]
  );

  const markLeadLost = useCallback(
    (leadId: string) => setLeadStage(leadId, "Lost"),
    [setLeadStage]
  );

  const markLeadDormant = useCallback(
    (leadId: string) => setLeadStage(leadId, "Dormant"),
    [setLeadStage]
  );

  const createDealFromLead = useCallback(
    (leadId: string, value = "TBD") => {
      const lead = state.leads.find((l) => l.id === leadId);
      if (!lead) return null;
      const id = generateCrmId("deal");
      patch((prev) => ({
        ...prev,
        deals: [
          ...prev.deals,
          {
            id,
            leadId,
            title: `${lead.matchedMedicine} — opportunity`,
            companyName: lead.companyName,
            value,
            stage: "Open",
            createdAt: todayIso(),
          },
        ],
        timeline: appendTimeline(prev.timeline, {
          leadId,
          date: todayIso(),
          title: "Deal created",
          description: `Deal opened (${value}).`,
          type: "deal",
        }),
      }));
      if (lead.stage === "Negotiation") {
        setLeadStage(leadId, "Won");
      }
      return id;
    },
    [patch, setLeadStage, state.leads]
  );

  const sendLeadEmail = useCallback(
    (input: SendLeadEmailInput) => {
      const lead = state.leads.find((l) => l.id === input.leadId);
      if (!lead) return;

      const newStage = stageAfterSendEmail(lead.stage);
      const email: CrmEmail = {
        id: generateCrmId("em"),
        leadId: lead.id,
        threadId: generateCrmId("thread"),
        direction: "outbound",
        mailboxLabels: ["SENT"],
        subject: input.subject,
        body: input.body,
        preview: input.body.slice(0, 120),
        fromEmail: "sales@religence.example.com",
        toEmail: lead.contactEmail,
        sentAt: todayIso(),
      };

      patch((prev) => ({
        ...prev,
        emails: [email, ...prev.emails],
        leads: prev.leads.map((l) =>
          l.id === lead.id
            ? {
                ...l,
                stage: newStage,
                lastActivity: todayIso(),
                followUpDate: followUpInDays(5),
              }
            : l
        ),
        timeline: appendTimeline(prev.timeline, {
          leadId: lead.id,
          date: todayIso(),
          title: "Email sent",
          description: input.subject,
          type: "email",
        }),
      }));
      setPendingComposeLeadId(null);
    },
    [patch, state.leads]
  );

  const sendCrmEmail = useCallback(
    async (input: SendCrmEmailInput): Promise<string | null> => {
      const lead =
        (input.leadId
          ? state.leads.find((l) => l.id === input.leadId)
          : null) ??
        state.leads.find(
          (l) =>
            l.contactEmail.toLowerCase() === input.toEmail.toLowerCase()
        );

      const email: CrmEmail = {
        id: generateCrmId("em"),
        leadId: lead?.id ?? null,
        threadId: generateCrmId("thread"),
        direction: "outbound",
        mailboxLabels: ["SENT"],
        subject: input.subject,
        body: input.body,
        preview: input.body.slice(0, 120),
        fromEmail: state.outlookEmail ?? "sales@religence.example.com",
        toEmail: input.toEmail,
        sentAt: todayIso(),
      };

      // No mailbox, no send. Recording it locally anyway would leave the CRM
      // claiming it sent an email that never left the building.
      if (!state.gmailConnected || !state.outlookAccountId) {
        return "Connect Outlook before sending email.";
      }

      const html = input.body.replace(/\n/g, "<br/>");
      const messageId = input.replyToMessageId ?? null;
      const accountId = state.outlookAccountId;
      // With a real Outlook message id, use the threading endpoints so the
      // mail lands in the recipient's existing conversation. Without one
      // (locally composed mail), fall back to a plain send.
      const sent =
        messageId && input.mode === "forward"
          ? await forwardOutlookMessage({ accountId, messageId, to: input.toEmail, html })
          : messageId && input.mode === "replyAll"
            ? await replyAllOutlookMessage({ accountId, messageId, html })
            : messageId && input.mode === "reply"
              ? await replyOutlookMessage({ accountId, messageId, html })
              : await sendOutlookMessage({
                  accountId,
                  to: input.toEmail,
                  subject: input.subject,
                  html,
                });
      if (!sent.live) {
        return sent.error;
      }

      patch((prev) => {
        if (!lead) {
          return { ...prev, emails: [email, ...prev.emails] };
        }
        const newStage = stageAfterSendEmail(lead.stage);
        return {
          ...prev,
          emails: [email, ...prev.emails],
          leads: prev.leads.map((l) =>
            l.id === lead.id
              ? {
                  ...l,
                  stage: newStage,
                  lastActivity: todayIso(),
                  followUpDate: followUpInDays(5),
                }
              : l
          ),
          timeline: appendTimeline(prev.timeline, {
            leadId: lead.id,
            date: todayIso(),
            title: "Email sent",
            description: input.subject,
            type: "email",
          }),
        };
      });

      return null;
    },
    [
      patch,
      state.gmailConnected,
      state.leads,
      state.outlookAccountId,
      state.outlookEmail,
    ]
  );

  const linkEmailToLead = useCallback(
    (emailId: string, leadId: string) => {
      patch((prev) => {
        const email = prev.emails.find((e) => e.id === emailId);
        const lead = prev.leads.find((l) => l.id === leadId);
        if (!email || !lead) return prev;
        const replyStages = [
          "Intro Email Sent",
          "Follow-up Sent",
        ] as LeadStage[];
        const newStage =
          email.direction === "inbound" &&
          replyStages.includes(lead.stage)
            ? "Replied"
            : lead.stage;
        return {
          ...prev,
          emails: prev.emails.map((e) =>
            e.id === emailId ? { ...e, leadId } : e
          ),
          // The link is CRM-owned: persist it, or the next Outlook sync drops it.
          emailMeta: upsertEmailMeta(prev.emailMeta, emailId, { leadId }),
          leads: prev.leads.map((l) =>
            l.id === leadId
              ? { ...l, stage: newStage, lastActivity: todayIso() }
              : l
          ),
          timeline: appendTimeline(prev.timeline, {
            leadId,
            date: todayIso(),
            title:
              email.direction === "inbound"
                ? "Reply linked — stage: Replied"
                : "Email linked to lead",
            description: email.subject,
            type: "email",
          }),
        };
      });
    },
    [patch]
  );

  const setEmailFlag = useCallback(
    (emailId: string, flag: EmailFlag, on: boolean) => {
      // Mirror the change into Outlook, best effort: Outlook is the source of
      // truth, so if the call fails the next sync simply restores its state.
      // Locally composed mail ("thread-…" ids) doesn't exist in Outlook.
      const email = state.emails.find((e) => e.id === emailId);
      const accountId = state.outlookAccountId;
      if (
        email &&
        accountId &&
        state.gmailConnected &&
        !email.threadId.startsWith("thread-")
      ) {
        const threadIds = [email.threadId];
        if (flag === "trashed" && on) {
          void trashOutlookThreads({ accountId, threadIds });
        } else if (flag === "read") {
          void batchModifyOutlookThreads({
            accountId,
            threadIds,
            ...(on
              ? { removeLabelIds: ["UNREAD"] }
              : { addLabelIds: ["UNREAD"] }),
          });
        } else if (flag === "starred") {
          void batchModifyOutlookThreads({
            accountId,
            threadIds,
            ...(on
              ? { addLabelIds: ["STARRED"] }
              : { removeLabelIds: ["STARRED"] }),
          });
        } else if (flag === "archived" && on) {
          void batchModifyOutlookThreads({
            accountId,
            threadIds,
            removeLabelIds: ["INBOX"],
          });
        }
        // ponytail: un-archive / un-trash stay local-only — the backend has
        // no restore endpoint. Add one if users ask for undo in Outlook too.
      }

      patch((prev) => ({
        ...prev,
        emailMeta: upsertEmailMeta(prev.emailMeta, emailId, { [flag]: on }),
      }));
    },
    [patch, state.emails, state.gmailConnected, state.outlookAccountId]
  );

  const emailIdsWithFlag = useCallback(
    (flag: EmailFlag) =>
      state.emailMeta.filter((m) => m[flag]).map((m) => m.id),
    [state.emailMeta]
  );

  const syncOutlookInbox = useCallback(
    async (preferredAccountId?: string | null, preferredEmail?: string | null) => {
      // Newest sync wins. Switching A -> B -> A can leave an older sync in
      // flight; without this its stale threads would land on top of B's.
      const seq = ++outlookSyncSeqRef.current;
      const isStale = () => seq !== outlookSyncSeqRef.current;

      const accountsRes = await listOutlookAccounts();
      if (!accountsRes.live || isStale()) return;
      const accounts: OutlookAccount[] = [...accountsRes.data];
      const preferredEmailNorm = (preferredEmail ?? "").trim().toLowerCase();
      const account =
        (preferredAccountId
          ? accounts.find((a) => a.id === preferredAccountId)
          : null) ??
        (preferredEmailNorm
          ? accounts.find((a) => a.email.toLowerCase() === preferredEmailNorm)
          : null) ??
        (outlookAccountIdRef.current
          ? accounts.find((a) => a.id === outlookAccountIdRef.current)
          : null) ??
        accounts.find((a) => a.status === "active") ??
        accounts[0];
      if (!account) {
        patch((prev) => ({
          ...prev,
          gmailConnected: false,
          outlookAccountId: null,
          outlookEmail: null,
          outlookAccounts: [],
          emails: [],
        }));
        return;
      }

      // Select the account before the threads land. The mailbox takes a second
      // to fetch; without this the rail keeps the old account highlighted the
      // whole time and the click reads as "nothing happened".
      patch((prev) => ({
        ...prev,
        gmailConnected: true,
        outlookAccountId: account.id,
        outlookEmail: account.email,
        outlookAccounts: accounts,
        ...(account.id === prev.outlookAccountId ? {} : { emails: [] }),
      }));

      const folderSources = [
        { labelId: "INBOX", mailboxLabel: "INBOX" },
        { labelId: "SENT", mailboxLabel: "SENT" },
        { labelId: "JUNK", mailboxLabel: "JUNK" },
      ] as const;
      const threadBuckets = new Map<
        string,
        { thread: OutlookThreadItem; mailboxLabels: Set<string> }
      >();

      const folderResults = await Promise.all(
        folderSources.map((source) =>
          listOutlookThreads(account.id, 25, source.labelId)
        )
      );
      if (isStale()) return;

      folderSources.forEach((source, i) => {
        const folderThreadsRes = folderResults[i];
        if (!folderThreadsRes.live) return;
        for (const thread of folderThreadsRes.data.threads) {
          const key = thread.threadId || thread.id;
          const existing = threadBuckets.get(key);
          if (!existing) {
            threadBuckets.set(key, {
              thread,
              mailboxLabels: new Set([source.mailboxLabel]),
            });
            continue;
          }
          existing.mailboxLabels.add(source.mailboxLabel);
          const existingDate = existing.thread.date ?? "";
          const incomingDate = thread.date ?? "";
          if (incomingDate > existingDate) {
            existing.thread = thread;
          }
        }
      });

      if (threadBuckets.size === 0) {
        const allThreadsRes = await listOutlookThreads(account.id, 25);
        if (!allThreadsRes.live) {
          patch((prev) => ({
            ...prev,
            gmailConnected: true,
            outlookAccountId: account.id,
            outlookEmail: account.email,
            outlookAccounts: accounts,
            emails: [],
          }));
          return;
        }
        for (const thread of allThreadsRes.data.threads) {
          const key = thread.threadId || thread.id;
          threadBuckets.set(key, {
            thread,
            mailboxLabels: new Set<string>(),
          });
        }
      }

      const accountEmail = account.email.toLowerCase();
      const rankedThreads = [...threadBuckets.values()]
        .sort((a, b) => {
          const ta = new Date(a.thread.date ?? 0).getTime();
          const tb = new Date(b.thread.date ?? 0).getTime();
          return tb - ta;
        })
        .slice(0, 25);

      // One request per thread, but all in flight at once. Serially this was
      // ~25 round trips to Graph back-to-back — the bulk of the switch delay.
      const threadDetails = await Promise.all(
        rankedThreads.map((item) =>
          getOutlookThread(account.id, item.thread.threadId || item.thread.id)
        )
      );
      if (isStale()) return;

      const syncedEmails: CrmEmail[] = [];
      rankedThreads.forEach((item, i) => {
        const threadId = item.thread.threadId || item.thread.id;
        const detailRes = threadDetails[i];
        const messages = detailRes.live ? [...detailRes.data.messages] : [];
        messages.sort((a, b) => {
          const ta = new Date(a.date ?? 0).getTime();
          const tb = new Date(b.date ?? 0).getTime();
          return ta - tb;
        });

        const latestMessage =
          messages.length > 0 ? messages[messages.length - 1] : null;
        const hasOutbound = messages.some(
          (message) => extractEmailAddress(message.from) === accountEmail
        );
        const hasInbound = messages.some((message) => {
          const from = extractEmailAddress(message.from);
          return Boolean(from) && from !== accountEmail;
        });

        // Trust the folder queries: a thread is SENT because it has messages
        // in Sent Items, not because any message in it is from you. Applied
        // unconditionally, the address heuristic put every thread you ever
        // replied to (and every mail to yourself) in Sent, turning the Sent
        // folder into a copy of All Mails. Heuristic kept only for the
        // fallback fetch, which has no folder labels at all.
        const mailboxLabels = new Set(item.mailboxLabels);
        if (mailboxLabels.size === 0) {
          if (hasInbound) mailboxLabels.add("INBOX");
          if (hasOutbound) mailboxLabels.add("SENT");
        }

        const fromRaw = latestMessage?.from ?? item.thread.from;
        const toRaw = latestMessage?.to ?? item.thread.to;
        const fromEmail = extractEmailAddress(fromRaw);
        const toEmail = extractEmailAddress(toRaw) || accountEmail;
        const body =
          latestMessage?.textBody ??
          latestMessage?.htmlBody ??
          latestMessage?.snippet ??
          item.thread.snippet ??
          "";
        const preview = (
          latestMessage?.snippet ??
          item.thread.snippet ??
          body
        ).slice(0, 120);

        const attachments = messages.flatMap((m) => m.attachments ?? []);

        syncedEmails.push({
          id: latestMessage?.id ?? `outlook-${threadId}`,
          leadId: null,
          threadId,
          direction: hasInbound ? "inbound" : "outbound",
          mailboxLabels: [...mailboxLabels],
          subject: latestMessage?.subject ?? item.thread.subject ?? "(No subject)",
          body,
          preview,
          fromEmail: fromEmail || accountEmail,
          toEmail,
          sentAt: latestMessage?.date ?? item.thread.date ?? todayIso(),
          attachments,
        });
      });

      syncedEmails.sort((a, b) => b.sentAt.localeCompare(a.sentAt));

      patch((prev) => ({
        ...prev,
        gmailConnected: true,
        outlookAccountId: account.id,
        outlookEmail: account.email,
        outlookAccounts: accounts,
        emails: applyEmailMeta(syncedEmails, prev.emailMeta),
      }));
    },
    // Deliberately not depending on state.outlookAccountId: the selected
    // account is read through a ref instead. As a dependency it changed this
    // callback's identity on every sync, which re-fired the bootstrap effect
    // that depends on it, which synced again — 2-3x the requests per switch.
    [patch]
  );

  useEffect(() => {
    outlookAccountIdRef.current = state.outlookAccountId;
  }, [state.outlookAccountId]);

  useEffect(() => {
    if (!hydrated || !authUserId) return;
    void syncOutlookInbox(null, null);
  }, [hydrated, authUserId, syncOutlookInbox]);

  const switchOutlookAccount = useCallback(
    async (accountId: string) => {
      await syncOutlookInbox(accountId, null);
    },
    [syncOutlookInbox]
  );

  const connectGmail = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!getUser()?.id) return;
    const result = await fetchOutlookConnectUrl();
    if (result.live && result.data.url) {
      window.location.href = result.data.url;
    }
  }, []);

  const disconnectOutlook = useCallback(
    async (accountId?: string | null) => {
      const targetId = accountId ?? state.outlookAccountId;
      if (targetId) {
        await disconnectOutlookAccountApi(targetId);
      }

      const accountsRes = await listOutlookAccounts();
      const remaining = accountsRes.live
        ? accountsRes.data.filter(
            (account) =>
              account.status === "active" &&
              (!targetId || account.id !== targetId)
          )
        : [];

      const nextAccount = remaining[0] ?? null;
      patch((prev) => ({
        ...prev,
        gmailConnected: Boolean(nextAccount),
        outlookAccountId: nextAccount?.id ?? null,
        outlookEmail: nextAccount?.email ?? null,
        outlookAccounts: remaining,
        emails: nextAccount ? prev.emails : [],
      }));
    },
    [patch, state.outlookAccountId]
  );

  const resetStore = useCallback(() => {
    setState(createInitialCrmState());
    setPendingComposeLeadId(null);
  }, []);

  const updateEmailTemplate = useCallback(
    (id: string, tplPatch: Partial<Omit<EmailTemplate, "id">>) => {
      patch((prev) => ({
        ...prev,
        emailTemplates: prev.emailTemplates.map((t) =>
          t.id === id ? { ...t, ...tplPatch } : t
        ),
      }));
    },
    [patch]
  );

  const replaceEmailTemplates = useCallback(
    (templates: EmailTemplate[]) => {
      patch((prev) => ({
        ...prev,
        emailTemplates: templates.map((tpl) => ({ ...tpl })),
      }));
    },
    [patch]
  );

  const addEmailTemplate = useCallback((): string => {
    const id = generateCrmId("tpl");
    const tpl = createBlankEmailTemplate(id);
    patch((prev) => ({
      ...prev,
      emailTemplates: [...prev.emailTemplates, tpl],
    }));
    return id;
  }, [patch]);

  const deleteEmailTemplate = useCallback(
    (id: string) => {
      if (isDefaultEmailTemplate(id)) return;
      patch((prev) => ({
        ...prev,
        emailTemplates: prev.emailTemplates.filter((t) => t.id !== id),
      }));
    },
    [patch]
  );

  const resetEmailTemplate = useCallback(
    (id: string) => {
      const def = getDefaultEmailTemplate(id);
      if (!def) return;
      patch((prev) => ({
        ...prev,
        emailTemplates: prev.emailTemplates.map((t) =>
          t.id === id ? { ...def } : t
        ),
      }));
    },
    [patch]
  );

  const resetAllEmailTemplates = useCallback(() => {
    patch((prev) => ({
      ...prev,
      emailTemplates: cloneDefaultEmailTemplates(),
    }));
  }, [patch]);

  // The catalogue is shared, so every edit is a server call first and local state
  // second. Nothing here writes the whole list — that is what duplicated it.
  const addSalt = useCallback(async (): Promise<string | null> => {
    const salt = createBlankSalt(generateCrmId("salt"));
    const res = await createBackendSalt(salt);
    if (!res.live) return null;
    patch((prev) => ({ ...prev, salts: [...prev.salts, res.data] }));
    return res.data.id;
  }, [patch]);

  const updateSalt = useCallback(
    async (
      id: string,
      saltPatch: Partial<Omit<SaltMasterItem, "id">>
    ): Promise<boolean> => {
      const res = await patchBackendSalt(id, saltPatch);
      if (!res.live) return false;
      const next = res.data;
      patch((prev) => {
        const existing = prev.salts.find((s) => s.id === id);
        const renamed =
          existing && existing.name !== next.name
            ? { from: existing.name, to: next.name }
            : null;
        return {
          ...prev,
          // `matchedSalt` on a lead is a NAME SNAPSHOT, not a foreign key, so a
          // rename has to be carried across by hand. This only fixes the current
          // user's leads. A server-side cascade is not safe yet: leads are still
          // on the whole-array PUT, so another user's next save would overwrite
          // it with their stale copy. Revisit once leads are per-item.
          leads: renamed
            ? prev.leads.map((l) =>
                l.matchedSalt === renamed.from
                  ? { ...l, matchedSalt: renamed.to }
                  : l
              )
            : prev.leads,
          salts: prev.salts.map((s) => (s.id === id ? next : s)),
        };
      });
      return true;
    },
    [patch]
  );

  const deleteSalt = useCallback(
    async (id: string): Promise<boolean> => {
      // The backend 409s if any medicine still points at this salt.
      const res = await removeBackendSalt(id);
      if (!res.live) return false;
      patch((prev) => ({
        ...prev,
        salts: prev.salts.filter((s) => s.id !== id),
      }));
      return true;
    },
    [patch]
  );

  const addMedicine = useCallback(
    async (saltId?: string): Promise<string | null> => {
      const fallbackSaltId = saltId ?? state.salts[0]?.id;
      if (!fallbackSaltId) return null; // the backend 400s on an unknown saltId
      const med = createBlankMedicine(generateCrmId("med"), fallbackSaltId);
      const res = await createBackendMedicine(med);
      if (!res.live) return null;
      patch((prev) => ({ ...prev, medicines: [...prev.medicines, res.data] }));
      return res.data.id;
    },
    [patch, state.salts]
  );

  const updateMedicine = useCallback(
    async (
      id: string,
      medPatch: Partial<Omit<DiscoveryMedicine, "id">>
    ): Promise<boolean> => {
      const res = await patchBackendMedicine(id, medPatch);
      if (!res.live) return false;
      const next = res.data;
      patch((prev) => {
        const existing = prev.medicines.find((m) => m.id === id);
        // As with salts: `matchedMedicine` / `dosageForm` are name snapshots on
        // the lead, so a rename is carried across by hand, for this user's leads
        // only. See the note in updateSalt.
        let leads = prev.leads;
        if (existing && existing.name !== next.name) {
          leads = leads.map((l) =>
            l.matchedMedicine === existing.name
              ? { ...l, matchedMedicine: next.name }
              : l
          );
        }
        if (existing && existing.dosageForm !== next.dosageForm) {
          leads = leads.map((l) =>
            l.matchedMedicine === next.name &&
            l.dosageForm === existing.dosageForm
              ? { ...l, dosageForm: next.dosageForm }
              : l
          );
        }
        return {
          ...prev,
          leads,
          medicines: prev.medicines.map((m) => (m.id === id ? next : m)),
        };
      });
      return true;
    },
    [patch]
  );

  const deleteMedicine = useCallback(
    async (id: string): Promise<boolean> => {
      // Local guard only — a medicine still named on a lead stays put. The lead
      // link is by name, so the server cannot check this for us.
      const med = state.medicines.find((m) => m.id === id);
      if (med && state.leads.some((l) => l.matchedMedicine === med.name)) {
        return false;
      }
      const res = await removeBackendMedicine(id);
      if (!res.live) return false;
      patch((prev) => ({
        ...prev,
        medicines: prev.medicines.filter((m) => m.id !== id),
      }));
      return true;
    },
    [patch, state.medicines, state.leads]
  );

  const value = useMemo<CrmContextValue>(
    () => ({
      ...state,
      hydrated,
      masterDataSynced,
      saveFromDiscovery,
      createLeadManual,
      updateLead,
      deleteContact,
      setLeadStage,
      advanceLeadStage,
      verifyLead,
      markLeadLost,
      markLeadDormant,
      createDealFromLead,
      sendLeadEmail,
      sendCrmEmail,
      linkEmailToLead,
      setEmailFlag,
      emailIdsWithFlag,
      connectGmail,
      disconnectOutlook,
      syncOutlookInbox,
      switchOutlookAccount,
      getCompany: (id) => state.companies.find((c) => c.id === id),
      getContact: (id) => state.contacts.find((c) => c.id === id),
      getLead: (id) => state.leads.find((l) => l.id === id),
      getLeadEmails: (leadId) =>
        state.emails.filter((e) => e.leadId === leadId),
      getLeadTimeline: (leadId) =>
        state.timeline
          .filter((t) => t.leadId === leadId)
          .sort((a, b) => b.date.localeCompare(a.date)),
      findCompanyByDiscoveryId,
      buildTemplateVars: (lead) => ({
        company_name: lead.companyName,
        contact_name: lead.contactName,
        salt_name: lead.matchedSalt,
        medicine_name: lead.matchedMedicine,
        dosage_form: lead.dosageForm,
        sender_name: getUserDisplayName(),
      }),
      updateEmailTemplate,
      replaceEmailTemplates,
      addEmailTemplate,
      deleteEmailTemplate,
      resetEmailTemplate,
      resetAllEmailTemplates,
      addSalt,
      updateSalt,
      deleteSalt,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      pendingComposeLeadId,
      setPendingComposeLeadId,
      resetStore,
    }),
    [
      state,
      hydrated,
      masterDataSynced,
      saveFromDiscovery,
      createLeadManual,
      updateLead,
      deleteContact,
      setLeadStage,
      advanceLeadStage,
      verifyLead,
      markLeadLost,
      markLeadDormant,
      createDealFromLead,
      sendLeadEmail,
      sendCrmEmail,
      linkEmailToLead,
      setEmailFlag,
      emailIdsWithFlag,
      connectGmail,
      disconnectOutlook,
      syncOutlookInbox,
      switchOutlookAccount,
      findCompanyByDiscoveryId,
      updateEmailTemplate,
      replaceEmailTemplates,
      addEmailTemplate,
      deleteEmailTemplate,
      resetEmailTemplate,
      resetAllEmailTemplates,
      addSalt,
      updateSalt,
      deleteSalt,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      pendingComposeLeadId,
      resetStore,
    ]
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}

export { applyTemplate, DEFAULT_EMAIL_TEMPLATES, EMAIL_TEMPLATES } from "./email-templates";
