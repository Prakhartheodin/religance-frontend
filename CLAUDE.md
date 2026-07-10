# espanda-app — CLAUDE.md

## Project overview

Next.js 16 (App Router) + TypeScript + Tailwind CSS admin dashboard starter. Runs as a static export (`output: "export"`). State management via Redux Toolkit. UI component library is **Preline**. Charts use ApexCharts. All new pages go inside `app/`.

The `full_template/` folder is the **complete reference implementation** — it contains every page, component, and data file the starter kit ships with. When building new features, **always check `full_template/` first** before writing anything from scratch.

---

## Absolute rule for Claude Code and Cursor

> **Before writing any component, data file, chart, table, form, or UI pattern, search `full_template/` for an existing implementation. Copy and adapt rather than write from scratch.**

---

## Directory structure

```
espanda-app/
├── app/                        # Working app (your code goes here)
│   ├── layout.tsx              # Root layout — Redux Provider + Context
│   ├── page.tsx                # Home / landing page
│   ├── (components)/
│   │   ├── layout.tsx          # Wraps html/body with theme attributes from Redux
│   │   └── (contentlayout)/    # Sidebar + header layout for dashboard pages
│   │       └── dashboards/crm/ # Example: one page already built
├── shared/                     # App-specific shared code (mirrors full_template/shared)
│   ├── contextapi.tsx
│   ├── data/                   # Data files used by pages
│   ├── firebase/
│   ├── layout-components/      # Header, sidebar, footer, etc.
│   └── redux/                  # Store, actions, reducer
├── full_template/              # READ-ONLY reference — all components live here
│   ├── app/                    # 185 page files across all sections
│   └── shared/                 # All reusable layout components and data
├── public/assets/              # Images, SCSS, CSS
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## How to add a new page

1. **Find the closest match in `full_template/app/(components)/(contentlayout)/`**
2. Copy the page file into the same path under `app/(components)/(contentlayout)/`
3. If the page imports from `@/shared/data/...`, copy that data file into `shared/data/` too
4. All imports use the `@/` alias (maps to the project root via `tsconfig.json`)

### Example — adding the Analytics dashboard

```tsx
// Source: full_template/app/(components)/(contentlayout)/dashboards/analytics/page.tsx
// Destination: app/(components)/(contentlayout)/dashboards/analytics/page.tsx
// Data file:   full_template/shared/data/dashboards/analyticsdata.tsx → shared/data/dashboards/analyticsdata.tsx
```

---

## Layout system

Pages inside `app/(components)/(contentlayout)/` automatically get the full sidebar + header layout via the nearest `layout.tsx`. Do not re-add Header/Sidebar/Footer inside individual page files.

| Layout file | What it provides |
|---|---|
| `app/layout.tsx` | Redux `<Provider>` + `<Initialload>` context |
| `app/(components)/layout.tsx` | `<html>` / `<body>` with theme CSS vars from Redux state |
| `app/(components)/(contentlayout)/layout.tsx` | Sidebar + Header + Footer wrapper |

---

## Reusable layout components (`shared/layout-components/`)

These are already wired into the content layout — use them inside page files as needed.

| Import path | Component | Props |
|---|---|---|
| `@/shared/layout-components/seo/seo` | `<Seo title="..." />` | `title: string` |
| `@/shared/layout-components/page-header/pageheader` | `<Pageheader currentpage activepage mainpage />` | breadcrumb |
| `@/shared/layout-components/header/header` | `<Header />` | none (connected to Redux) |
| `@/shared/layout-components/sidebar/sidebar` | `<Sidebar />` | none |
| `@/shared/layout-components/sidebar/nav` | Navigation data array | — |
| `@/shared/layout-components/footer/footer` | `<Footer />` | none |
| `@/shared/layout-components/switcher/switcher` | `<Switcher />` | theme switcher panel |
| `@/shared/layout-components/backtotop/backtotop` | `<Backtotop />` | none |
| `@/shared/layout-components/showcode/showcode` | `<Showcode />` | code preview toggle |
| `@/shared/layout-components/modal-search/modalsearch` | `<Modalsearch />` | search modal |

---

## Available pages in `full_template/`

### Dashboards (`full_template/app/(components)/(contentlayout)/dashboards/`)
- `personal/` — Personal dashboard with stats + activity feed
- `ecommerce/` — Revenue, orders, top products
- `sales/` — Sales analytics
- `crypto/` — Crypto portfolio overview
- `nft/` — NFT marketplace stats
- `projects/` — Project tracking dashboard
- `crm/` — CRM with deals, leads, contacts
- `stocks/` — Stock market overview
- `courses/` — E-learning stats
- `hrm/` — HR management overview
- `jobs/` — Job board overview
- `analytics/` — Traffic + conversion analytics

### Apps (`full_template/app/(components)/(contentlayout)/apps/`)
- `crypto/` — buy-sell, transactions, wallet, market-cap, currency-exchange
- `nft/` — marketplace, nft-details, wallet-integration, live-auction, create-nft
- `projects/` — project-list, project-overview, create-project
- `crm/` — leads, contacts, deals, companies
- `jobs/` — job-post, search-company, candidate-details, search-jobs, job-details, jobs-list, search-candidate

### E-commerce (`full_template/app/(components)/(contentlayout)/pages/ecommerce/`)
- products, product-details, product-list, cart, checkout, order-details, orders, add-products, edit-products, wishlist

### Email & Invoice (`full_template/app/(components)/(contentlayout)/pages/`)
- `email/` — mail-app, mail-settings
- `invoice/` — invoice-list, invoice-details, create-invoice

### Charts (`full_template/app/(components)/(contentlayout)/charts/`)
- `apexcharts/` — area, bar, bubble, candlestick, column, heatmap, line, mixed, pie, polararea, radar, radialbar, range-area, scatter, timeline, treemap, boxplot
- `chartjs/` — chart.js examples
- `echart/` — Apache ECharts examples

### Tables (`full_template/app/(components)/(contentlayout)/tables/`)
- `table/` — basic HTML table
- `gridjs-table/` — Grid.js
- `data-table/` — react-table data table

### Maps (`full_template/app/(components)/(contentlayout)/maps/`)
- `vector-maps/` — react-simple-maps
- `leaflet-map/` — React Leaflet

### Forms (`full_template/app/(components)/(contentlayout)/forms/`)
- `form-layouts/`, `validation/`, `formeditors/` (Quill), `select2/`, `formelements/inputs/`, `formelements/form-select/`, `formelements/advancedselect/`

### UI Elements (`full_template/app/(components)/(contentlayout)/ui-elements/`)
- pagination, object-fit, buttons, badges, alerts, dropdowns, tooltips, cards, toasts, spinners, list groups, progress

### Advanced UI (`full_template/app/(components)/(contentlayout)/advanced-ui/`)
- swiper-js, navbar, offcanvas, scrollspy, customscrollbar, ratings, stepper, draggable-cards, accordions & collapse, modals & closes

### Utilities (`full_template/app/(components)/(contentlayout)/utilities/`)
- borders, grids, colors, typography, columns, avatars, flex

### Other
- `icons/` — icon showcase
- `widgets/` — widget collection
- `landing/` and `jobs-landing/` — landing page layouts
- `authentication/` — login, register, create-password, coming-soon (both basic and cover variants)

---

## Data files (`full_template/shared/data/`)

Copy the relevant data file to `shared/data/` when using a page that imports from it.

| Folder | Contents |
|---|---|
| `dashboards/` | crmdata, salesdata, personaldata, analyticsdata, cryptodata, ecommercedata, nftdata, projectsdata, stocksdata, coursedata, hrmdata, jobsdata |
| `charts/` | echartdata, chartjsdata (apexcharts data is usually inline) |
| `tables/` | tabledata, gridjsdata, datatabledata |
| `forms/` | select2data |
| `maps/` | leafletmapdata, vectordata |
| `pages/` | profiledata, chartsdata, teamdata |
| `apps/` | gallerydata |
| `authentication/` | comingsoondata |
| `widgets/` | widgetsdata |
| `ui-elements/` | progressdata, listgroupdata, alertsdata, badgesdata, dropdownsdata, tooltipdata, cardsdata, toastdata, spinnersdata, buttonsdata |
| `utilities/` | avatarsdata, colorsdata |
| `prism/` | code snippet strings for showcode panels |

---

## Coding patterns to follow

### Every page file starts with
```tsx
"use client"
import Seo from '@/shared/layout-components/seo/seo';
import React, { Fragment } from 'react';
```

### Dynamic chart imports (avoids SSR errors)
```tsx
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
```

### Grid system
Use Tailwind's 12-column grid: `grid grid-cols-12 gap-x-6`. Breakpoint classes: `col-span-12 sm:col-span-6 xl:col-span-4 xxl:col-span-3`.

### Card pattern
```tsx
<div className="box">
  <div className="box-header">...</div>
  <div className="box-body">...</div>
</div>
```

### Button pattern
```tsx
<button className="ti-btn bg-primary text-white btn-wave !font-medium !text-[0.85rem] !rounded-[0.35rem] !py-[0.51rem] !px-[0.86rem]">
```

### Redux ThemeChanger (for components that need theme state)
```tsx
import { connect } from 'react-redux';
import { ThemeChanger } from '@/shared/redux/action';
// ...
export default connect(mapStateToProps, { ThemeChanger })(MyComponent);
```

---

## Tech stack reference

| Library | Version | Usage |
|---|---|---|
| Next.js | 16.2.4 | Framework (static export) |
| React | ^18 | UI |
| TypeScript | ^5 | Types |
| Tailwind CSS | ^3.4 | Styling |
| Preline | ^2.1 | UI component library |
| ApexCharts | ^3.49 | Charts (via react-apexcharts) |
| Redux Toolkit | ^1.9.7 | State management |
| Firebase | ^10.11 | Auth / DB |
| simplebar-react | ^3.2.5 | Custom scrollbar |
| sass | ^1.75 | SCSS compilation |

---

## tsconfig paths

```json
"@/*": ["./*"]
```

So `@/shared/...` → `./shared/...`, `@/app/...` → `./app/...`, `@/next.config` → `./next.config.js`.
