import { ACTIVE_LEADS_MOCK } from "@/shared/crm/active-leads/mock-leads";
import type {
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmEmail,
  CrmLead,
  CrmState,
  CrmTimelineEvent,
} from "./types";
import { cloneDefaultEmailTemplates } from "./email-templates";
import { cloneDefaultMedicines } from "./medicines-master";
import { cloneDefaultSalts } from "./salts-master";
import { generateCrmId } from "./workflow";

function seedFromMock(): CrmState {
  const companies: CrmCompany[] = [];
  const contacts: CrmContact[] = [];
  const leads: CrmLead[] = [];
  const timeline: CrmTimelineEvent[] = [];
  const emails: CrmEmail[] = [];
  const deals: CrmDeal[] = [];

  const companyByName = new Map<string, CrmCompany>();

  for (const mock of ACTIVE_LEADS_MOCK) {
    let company = companyByName.get(mock.companyName);
    if (!company) {
      company = {
        id: generateCrmId("co"),
        name: mock.companyName,
        location: mock.location,
        website: `https://${mock.companyName.toLowerCase().replace(/\s+/g, "")}.example.com`,
        companyType: "Manufacturer",
        certification: "WHO-GMP",
        sourceLinks: [
          {
            label: "Discovery source",
            url: "https://example.com/source",
          },
        ],
        createdAt: mock.createdAt,
      };
      companyByName.set(mock.companyName, company);
      companies.push(company);
    }

    const contact: CrmContact = {
      id: generateCrmId("ct"),
      companyId: company.id,
      name: mock.contactName,
      role: mock.contactRole,
      email: mock.contactEmail,
      createdAt: mock.createdAt,
    };
    contacts.push(contact);

    const lead: CrmLead = {
      id: mock.id.startsWith("lead-") ? mock.id : generateCrmId("lead"),
      title: mock.title,
      companyId: company.id,
      contactId: contact.id,
      companyName: mock.companyName,
      contactName: mock.contactName,
      contactRole: mock.contactRole,
      contactEmail: mock.contactEmail,
      matchedSalt: mock.matchedSalt,
      matchedMedicine: mock.matchedMedicine,
      dosageForm: mock.dosageForm,
      location: mock.location,
      stage: mock.stage,
      leadScore: mock.leadScore,
      assignedTo: mock.assignedTo,
      followUpDate: mock.followUpDate,
      lastActivity: mock.lastActivity,
      notes: mock.notes,
      createdAt: mock.createdAt,
      sourceLinks: company.sourceLinks,
    };
    leads.push(lead);

    timeline.push({
      id: generateCrmId("tl"),
      leadId: lead.id,
      date: mock.createdAt,
      title: "Lead created",
      description: "Imported from initial CRM dataset.",
      type: "stage",
    });

    if (mock.stage !== "Saved") {
      timeline.push({
        id: generateCrmId("tl"),
        leadId: lead.id,
        date: mock.lastActivity,
        title: `Stage: ${mock.stage}`,
        description: "Current pipeline stage.",
        type: "stage",
      });
    }

    if (mock.id === "lead-1") {
      emails.push({
        id: generateCrmId("em"),
        leadId: lead.id,
        threadId: "thread-1",
        direction: "outbound",
        subject: "Re: Budesonide respule supply — pricing follow-up",
        body: "Hi Rajesh, following up on our discussion regarding monthly supply…",
        preview: "Hi Rajesh, following up on our discussion regarding monthly supply…",
        fromEmail: "sales@religence.example.com",
        toEmail: mock.contactEmail,
        sentAt: "2026-06-02",
      });
    }

    if (mock.stage === "Won") {
      deals.push({
        id: generateCrmId("deal"),
        leadId: lead.id,
        title: `${mock.matchedMedicine} — annual supply`,
        companyName: mock.companyName,
        value: "₹1.2 Cr / year",
        stage: "Won",
        createdAt: mock.lastActivity,
      });
    }
  }

  return {
    companies,
    contacts,
    leads,
    deals,
    emails,
    timeline,
    gmailConnected: true,
    emailTemplates: cloneDefaultEmailTemplates(),
    salts: cloneDefaultSalts(),
    medicines: cloneDefaultMedicines(),
  };
}

export function createInitialCrmState(): CrmState {
  return seedFromMock();
}
