"use client";

import ActiveLeadsBoard from "@/shared/crm/active-leads/active-leads-board";
import Seo from "@/shared/layout-components/seo/seo";
import { Fragment, Suspense } from "react";

function ActiveLeadsBoardFallback() {
  return (
    <div className="text-center py-12 text-textmuted text-[0.875rem]">
      Loading active leads…
    </div>
  );
}

export default function ActiveLeadsPage() {
  return (
    <Fragment>
      <Seo title="Active Leads" />
      <Suspense fallback={<ActiveLeadsBoardFallback />}>
        <ActiveLeadsBoard />
      </Suspense>
    </Fragment>
  );
}
