"use client";

import type { CompanyProfileDetail } from "@/shared/crm/lead-discovery/company-profile-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  cloneDefaultMedicines,
  createBlankMedicine,
  getDefaultMedicine,
  isDefaultMedicine,
  type DiscoveryMedicine,
} from "./medicines-master";
import {
  cloneDefaultSalts,
  createBlankSalt,
  getDefaultSalt,
  isDefaultSalt,
  type SaltMasterItem,
} from "./salts-master";
import { loadCrmState, resetCrmState, saveCrmState } from "./storage";
import type {
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmEmail,
  CrmLead,
  CrmState,
  CrmTimelineEvent,
  LeadStage,
  SaveToContactOption,
} from "./types";
import { CURRENT_USER } from "./types";
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
};

type CrmContextValue = CrmState & {
  hydrated: boolean;
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
  sendCrmEmail: (input: SendCrmEmailInput) => void;
  linkEmailToLead: (emailId: string, leadId: string) => void;
  connectGmail: () => void;
  getCompany: (id: string) => CrmCompany | undefined;
  getContact: (id: string) => CrmContact | undefined;
  getLead: (id: string) => CrmLead | undefined;
  getLeadEmails: (leadId: string) => CrmEmail[];
  getLeadTimeline: (leadId: string) => CrmTimelineEvent[];
  findCompanyByDiscoveryId: (discoveryId: string) => CrmCompany | undefined;
  buildTemplateVars: (lead: CrmLead) => TemplateVariables;
  updateEmailTemplate: (
    id: string,
    patch: Partial<Omit<EmailTemplate, "id">>
  ) => void;
  addEmailTemplate: () => string;
  deleteEmailTemplate: (id: string) => void;
  resetEmailTemplate: (id: string) => void;
  resetAllEmailTemplates: () => void;
  addSalt: () => string;
  updateSalt: (id: string, patch: Partial<Omit<SaltMasterItem, "id">>) => void;
  deleteSalt: (id: string) => boolean;
  resetSalt: (id: string) => void;
  resetAllSalts: () => void;
  addMedicine: (saltId?: string) => string;
  updateMedicine: (
    id: string,
    patch: Partial<Omit<DiscoveryMedicine, "id">>
  ) => void;
  deleteMedicine: (id: string) => boolean;
  resetMedicine: (id: string) => void;
  resetAllMedicines: () => void;
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

export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CrmState>(() => loadCrmState());
  const [hydrated, setHydrated] = useState(false);
  const [pendingComposeLeadId, setPendingComposeLeadId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setState(loadCrmState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCrmState(state);
  }, [state, hydrated]);

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
            assignedTo: CURRENT_USER,
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
    (input: SendCrmEmailInput) => {
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
        subject: input.subject,
        body: input.body,
        preview: input.body.slice(0, 120),
        fromEmail: "sales@religence.example.com",
        toEmail: input.toEmail,
        sentAt: todayIso(),
      };

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
    },
    [patch, state.leads]
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

  const connectGmail = useCallback(() => {
    patch((prev) => {
      const firstLead = prev.leads[0];
      const demoInbound: CrmEmail[] = [
        {
          id: generateCrmId("em"),
          leadId: null,
          threadId: generateCrmId("thread"),
          direction: "inbound",
          subject: "Re: Budesonide supply enquiry",
          body: "Thanks for your introduction. Please share COA and pricing for respules.\n\nWe are evaluating monthly volumes of 50k units. Kindly confirm lead time.",
          preview:
            "Thanks for your introduction. Please share COA and pricing for respules.",
          fromEmail: "rajesh.mehta@abcpharma.example.com",
          toEmail: "sales@religence.example.com",
          sentAt: todayIso(),
        },
        {
          id: generateCrmId("em"),
          leadId: firstLead?.id ?? null,
          threadId: generateCrmId("thread"),
          direction: "inbound",
          subject: "Sample request — Metformin 500mg",
          body: "Please dispatch 2 sample batches for stability review. Our QA team will revert within 5 business days.",
          preview:
            "Please dispatch 2 sample batches for stability review.",
          fromEmail: firstLead?.contactEmail ?? "qa@client.example.com",
          toEmail: "sales@religence.example.com",
          sentAt: todayIso(),
        },
      ];
      const hasUnlinkedInbound = prev.emails.some(
        (e) => e.leadId === null && e.direction === "inbound"
      );
      return {
        ...prev,
        gmailConnected: true,
        emails: hasUnlinkedInbound
          ? prev.emails
          : [...demoInbound, ...prev.emails],
      };
    });
  }, [patch]);

  const resetStore = useCallback(() => {
    setState(resetCrmState());
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

  const addSalt = useCallback((): string => {
    const id = generateCrmId("salt");
    const salt = createBlankSalt(id);
    patch((prev) => ({
      ...prev,
      salts: [...prev.salts, salt],
    }));
    return id;
  }, [patch]);

  const updateSalt = useCallback(
    (id: string, saltPatch: Partial<Omit<SaltMasterItem, "id">>) => {
      patch((prev) => {
        const existing = prev.salts.find((s) => s.id === id);
        if (!existing) return prev;

        const nextName = saltPatch.name?.trim();
        const renamed =
          nextName && nextName !== existing.name
            ? { from: existing.name, to: nextName }
            : null;

        return {
          ...prev,
          leads: renamed
            ? prev.leads.map((l) =>
                l.matchedSalt === renamed.from
                  ? { ...l, matchedSalt: renamed.to }
                  : l
              )
            : prev.leads,
          salts: prev.salts.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...saltPatch,
                  name: nextName ?? s.name,
                }
              : s
          ),
        };
      });
    },
    [patch]
  );

  const deleteSalt = useCallback(
    (id: string): boolean => {
      if (isDefaultSalt(id)) return false;
      let deleted = false;
      patch((prev) => {
        if (prev.medicines.some((m) => m.saltId === id)) return prev;
        deleted = true;
        return {
          ...prev,
          salts: prev.salts.filter((s) => s.id !== id),
        };
      });
      return deleted;
    },
    [patch]
  );

  const resetSalt = useCallback(
    (id: string) => {
      const def = getDefaultSalt(id);
      if (!def) return;
      patch((prev) => {
        const existing = prev.salts.find((s) => s.id === id);
        const leads =
          existing && existing.name !== def.name
            ? prev.leads.map((l) =>
                l.matchedSalt === existing.name
                  ? { ...l, matchedSalt: def.name }
                  : l
              )
            : prev.leads;
        return {
          ...prev,
          leads,
          salts: prev.salts.map((s) => (s.id === id ? { ...def } : s)),
        };
      });
    },
    [patch]
  );

  const resetAllSalts = useCallback(() => {
    patch((prev) => ({
      ...prev,
      salts: cloneDefaultSalts(),
    }));
  }, [patch]);

  const addMedicine = useCallback(
    (saltId?: string): string => {
      const id = generateCrmId("med");
      patch((prev) => {
        const med = createBlankMedicine(
          id,
          saltId ?? prev.salts[0]?.id ?? "1"
        );
        return {
          ...prev,
          medicines: [...prev.medicines, med],
        };
      });
      return id;
    },
    [patch]
  );

  const updateMedicine = useCallback(
    (id: string, medPatch: Partial<Omit<DiscoveryMedicine, "id">>) => {
      patch((prev) => {
        const existing = prev.medicines.find((m) => m.id === id);
        if (!existing) return prev;

        const nextName = medPatch.name?.trim();
        const nextDosageForm = medPatch.dosageForm?.trim();
        const renamed =
          nextName && nextName !== existing.name
            ? { from: existing.name, to: nextName }
            : null;
        const dosageChanged =
          nextDosageForm && nextDosageForm !== existing.dosageForm
            ? { from: existing.dosageForm, to: nextDosageForm }
            : null;

        let leads = prev.leads;
        if (renamed) {
          leads = leads.map((l) =>
            l.matchedMedicine === renamed.from
              ? { ...l, matchedMedicine: renamed.to }
              : l
          );
        }
        if (dosageChanged) {
          const medName = nextName ?? existing.name;
          leads = leads.map((l) =>
            l.matchedMedicine === medName && l.dosageForm === dosageChanged.from
              ? { ...l, dosageForm: dosageChanged.to }
              : l
          );
        }

        return {
          ...prev,
          leads,
          medicines: prev.medicines.map((m) =>
            m.id === id
              ? {
                  ...m,
                  ...medPatch,
                  name: nextName ?? m.name,
                  dosageForm: nextDosageForm ?? m.dosageForm,
                }
              : m
          ),
        };
      });
    },
    [patch]
  );

  const deleteMedicine = useCallback(
    (id: string): boolean => {
      if (isDefaultMedicine(id)) return false;
      let deleted = false;
      patch((prev) => {
        const med = prev.medicines.find((m) => m.id === id);
        if (!med) return prev;
        if (prev.leads.some((l) => l.matchedMedicine === med.name)) return prev;
        deleted = true;
        return {
          ...prev,
          medicines: prev.medicines.filter((m) => m.id !== id),
        };
      });
      return deleted;
    },
    [patch]
  );

  const resetMedicine = useCallback(
    (id: string) => {
      const def = getDefaultMedicine(id);
      if (!def) return;
      patch((prev) => {
        const existing = prev.medicines.find((m) => m.id === id);
        let leads = prev.leads;
        if (existing && existing.name !== def.name) {
          leads = leads.map((l) =>
            l.matchedMedicine === existing.name
              ? { ...l, matchedMedicine: def.name }
              : l
          );
        }
        if (existing && existing.dosageForm !== def.dosageForm) {
          leads = leads.map((l) =>
            l.matchedMedicine === def.name &&
            l.dosageForm === existing.dosageForm
              ? { ...l, dosageForm: def.dosageForm }
              : l
          );
        }
        return {
          ...prev,
          leads,
          medicines: prev.medicines.map((m) => (m.id === id ? { ...def } : m)),
        };
      });
    },
    [patch]
  );

  const resetAllMedicines = useCallback(() => {
    patch((prev) => ({
      ...prev,
      medicines: cloneDefaultMedicines(),
    }));
  }, [patch]);

  const value = useMemo<CrmContextValue>(
    () => ({
      ...state,
      hydrated,
      saveFromDiscovery,
      createLeadManual,
      updateLead,
      setLeadStage,
      advanceLeadStage,
      verifyLead,
      markLeadLost,
      markLeadDormant,
      createDealFromLead,
      sendLeadEmail,
      sendCrmEmail,
      linkEmailToLead,
      connectGmail,
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
        sender_name: CURRENT_USER,
      }),
      updateEmailTemplate,
      addEmailTemplate,
      deleteEmailTemplate,
      resetEmailTemplate,
      resetAllEmailTemplates,
      addSalt,
      updateSalt,
      deleteSalt,
      resetSalt,
      resetAllSalts,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      resetMedicine,
      resetAllMedicines,
      pendingComposeLeadId,
      setPendingComposeLeadId,
      resetStore,
    }),
    [
      state,
      hydrated,
      saveFromDiscovery,
      createLeadManual,
      updateLead,
      setLeadStage,
      advanceLeadStage,
      verifyLead,
      markLeadLost,
      markLeadDormant,
      createDealFromLead,
      sendLeadEmail,
      sendCrmEmail,
      linkEmailToLead,
      connectGmail,
      findCompanyByDiscoveryId,
      updateEmailTemplate,
      addEmailTemplate,
      deleteEmailTemplate,
      resetEmailTemplate,
      resetAllEmailTemplates,
      addSalt,
      updateSalt,
      deleteSalt,
      resetSalt,
      resetAllSalts,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      resetMedicine,
      resetAllMedicines,
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
