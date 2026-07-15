"use client";

import { leadEditHref } from "@/shared/crm/active-leads/active-leads-utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Legacy redirect: /active-leads/lead-xxx/ → /active-leads/edit/?id=lead-xxx */
export function LegacyLeadIdRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (id.startsWith("lead-")) {
      router.replace(leadEditHref(id));
    } else {
      router.replace("/active-leads/");
    }
  }, [id, router]);

  return (
    <div className="text-center py-16 text-textmuted text-[0.875rem]">
      <span
        className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"
        role="status"
        aria-label="Redirecting"
      />
      <p className="mb-0">Opening lead…</p>
    </div>
  );
}
