export type EmailTemplateCategory =
  | "introduction"
  | "follow-up"
  | "quotation";

export type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  category: EmailTemplateCategory;
  subject: string;
  body: string;
};

export const TEMPLATE_VARIABLES = [
  { key: "company_name", label: "Company" },
  { key: "contact_name", label: "Contact" },
  { key: "salt_name", label: "API salt" },
  { key: "medicine_name", label: "Medicine" },
  { key: "dosage_form", label: "Dosage form" },
  { key: "sender_name", label: "Sender" },
] as const;

export type TemplateVariableKey = (typeof TEMPLATE_VARIABLES)[number]["key"];

export type TemplateVariables = Record<TemplateVariableKey, string>;

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "first-intro",
    name: "First Introduction",
    description: "Initial outreach when a lead is verified or newly assigned.",
    category: "introduction",
    subject: "Partnership opportunity — {{salt_name}} for {{company_name}}",
    body: `Dear {{contact_name}},

We are reaching out regarding {{medicine_name}} ({{dosage_form}}) and your work with {{salt_name}}.

We would welcome a short call to explore supply and co-development options.

Best regards,
{{sender_name}}`,
  },
  {
    id: "salt-outreach",
    name: "Salt-specific Outreach",
    description: "Highlights matched API salt and dosage form for the company.",
    category: "introduction",
    subject: "{{salt_name}} formulations — introduction from {{sender_name}}",
    body: `Hi {{contact_name}},

Our team supports manufacturers and marketers active in {{salt_name}}, including {{medicine_name}}.

If {{company_name}} is evaluating partners for {{dosage_form}} products, we can share our portfolio and certifications.

Regards,
{{sender_name}}`,
  },
  {
    id: "follow-up-1",
    name: "Follow-up 1",
    description: "Second touch after intro email with no reply.",
    category: "follow-up",
    subject: "Re: {{medicine_name}} — following up",
    body: `Dear {{contact_name}},

I wanted to follow up on my earlier note about {{salt_name}} / {{medicine_name}}.

Please let us know if you would like product details or samples.

Thanks,
{{sender_name}}`,
  },
  {
    id: "quotation-follow-up",
    name: "Quotation Follow-up",
    description: "Reminder after quotation or sample request stage.",
    category: "quotation",
    subject: "Quotation follow-up — {{company_name}}",
    body: `Hi {{contact_name}},

Sharing a gentle reminder on the quotation we sent for {{medicine_name}}.

Happy to clarify MOQ, lead times, or documentation.

Best,
{{sender_name}}`,
  },
];

/** @deprecated Use DEFAULT_EMAIL_TEMPLATES or CRM state `emailTemplates`. */
export const EMAIL_TEMPLATES = DEFAULT_EMAIL_TEMPLATES;

export function cloneDefaultEmailTemplates(): EmailTemplate[] {
  return DEFAULT_EMAIL_TEMPLATES.map((t) => ({ ...t }));
}

export function getDefaultEmailTemplate(id: string): EmailTemplate | undefined {
  return DEFAULT_EMAIL_TEMPLATES.find((t) => t.id === id);
}

export function isDefaultEmailTemplate(id: string): boolean {
  return DEFAULT_EMAIL_TEMPLATES.some((t) => t.id === id);
}

export function createBlankEmailTemplate(id: string): EmailTemplate {
  return {
    id,
    name: "Untitled template",
    description: "",
    category: "introduction",
    subject: "",
    body: `Dear {{contact_name}},



Best regards,
{{sender_name}}`,
  };
}

export function applyTemplate(
  text: string,
  vars: TemplateVariables
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = vars[key as TemplateVariableKey];
    return v ?? "";
  });
}

export function categoryLabel(category: EmailTemplateCategory): string {
  if (category === "introduction") return "Introduction";
  if (category === "follow-up") return "Follow-up";
  return "Quotation";
}

export function categoryIcon(category: EmailTemplateCategory): string {
  if (category === "introduction") return "ri-mail-send-line";
  if (category === "follow-up") return "ri-reply-line";
  return "ri-file-list-3-line";
}
