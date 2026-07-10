"use client";

import LeadDiscoveryBoard from "@/shared/crm/lead-discovery/lead-discovery-board";
import Seo from "@/shared/layout-components/seo/seo";
import { Fragment } from "react";

export default function LeadDiscoveryPage() {
  return (
    <Fragment>
      <Seo title="Lead Discovery" />
      <LeadDiscoveryBoard />
    </Fragment>
  );
}
