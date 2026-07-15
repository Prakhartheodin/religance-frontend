import { LegacyLeadIdRedirect } from "@/shared/crm/active-leads/legacy-lead-id-redirect";

/** Production static export requires at least one path; dev handles any lead-* id client-side. */
export function generateStaticParams() {
  return [{ id: "legacy" }];
}

export default function LegacyLeadIdRoute() {
  return <LegacyLeadIdRedirect />;
}
