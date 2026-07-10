"use client";

import Pageheader from "@/shared/layout-components/page-header/pageheader";
import Seo from "@/shared/layout-components/seo/seo";
import React, { Fragment } from "react";

type EspandaBlankPageProps = {
  title: string;
  /** Breadcrumb parent (e.g. section name) */
  activepage: string;
  /** Breadcrumb current; defaults to `title` */
  mainpage?: string;
  description?: string;
};

export default function EspandaBlankPage({
  title,
  activepage,
  mainpage,
  description = "Content coming soon.",
}: EspandaBlankPageProps) {
  return (
    <Fragment>
      <Seo title={title} />
      <Pageheader
        currentpage={title}
        activepage={activepage}
        mainpage={mainpage ?? title}
      />
      <div className="grid grid-cols-12 gap-x-6">
        <div className="xl:col-span-12 col-span-12">
          <div className="box">
            <div className="box-body">
              <p className="text-textmuted dark:text-textmuted/90 mb-0">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
