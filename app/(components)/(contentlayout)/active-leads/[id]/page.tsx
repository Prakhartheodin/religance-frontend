import LeadFormPage from "@/shared/crm/active-leads/lead-form-page";

/** Static export requires at least one pre-rendered path; real IDs resolve client-side. */
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function EditLeadRoute() {
  return <LeadFormPage mode="edit" />;
}
