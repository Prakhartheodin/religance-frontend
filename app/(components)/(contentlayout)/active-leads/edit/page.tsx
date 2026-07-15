import LeadFormPage from "@/shared/crm/active-leads/lead-form-page";

/** Static route for edit mode — lead id via ?id= (required for output: "export"). */
export default function EditLeadRoute() {
  return <LeadFormPage mode="edit" />;
}
