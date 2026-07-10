"use client";

import EspandaBlankPage from "@/shared/layout-components/espanda-blank-page/espanda-blank-page";

export function createCrmPlaceholderPage(title: string) {
  return function CrmPlaceholderPage() {
    return (
      <EspandaBlankPage
        title={title}
        activepage="CRM"
        mainpage={title}
        description="This screen will be built in a later step."
      />
    );
  };
}
