# Religence CRM User Guide

30-page user documentation for the Religence pharma CRM application.

## Files

| File | Description |
|------|-------------|
| `religence-user-guide.html` | Source document (edit this) |
| `Religence-CRM-User-Guide.pdf` | Generated PDF (~30 pages) |

## Regenerate PDF

**Option A — Chrome (recommended on macOS):**

```bash
./scripts/generate-user-guide-pdf.sh
```

**Option B — Browser manually:**

1. Open `religence-user-guide.html` in Chrome
2. File → Print → Save as PDF
3. Enable "Background graphics" for best appearance

**Option C — Node + Puppeteer:**

```bash
node scripts/generate-user-guide-pdf.mjs
```

## Contents (30 pages)

1. Cover & table of contents
2. Introduction & navigation
3. CRM concepts (entities, salts/medicines, pipeline stages)
4. Salts Master & Medicine Master setup
5. Lead Discovery workflow
6. Save to Contact flows
7. Verification Queue
8. Active Leads pipeline
9. Email Templates & outreach
10. Inbox & email management
11. Saved Contacts
12. Reports & analytics
13. Daily workflow & best practices
14. Troubleshooting & quick reference
