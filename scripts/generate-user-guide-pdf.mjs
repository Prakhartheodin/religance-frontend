#!/usr/bin/env node
/**
 * Generates Religence CRM User Guide PDF from HTML.
 * Usage: node scripts/generate-user-guide-pdf.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(root, "docs", "religence-user-guide.html");
const pdfPath = join(root, "docs", "Religence-CRM-User-Guide.pdf");

if (!existsSync(htmlPath)) {
  console.error("Missing:", htmlPath);
  process.exit(1);
}

const script = `
const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://${htmlPath.replace(/\\/g, "/")}', { waitUntil: 'networkidle0' });
  await page.pdf({
    path: '${pdfPath.replace(/\\/g, "/")}',
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  });
  await browser.close();
  console.log('PDF written:', '${pdfPath.replace(/\\/g, "/")}');
})().catch((e) => { console.error(e); process.exit(1); });
`;

const tmpScript = join(root, "scripts", ".gen-pdf-tmp.cjs");
const { writeFileSync, unlinkSync } = await import("node:fs");
writeFileSync(tmpScript, script);

console.log("Installing puppeteer (one-time)…");
const install = spawnSync("npm", ["install", "--no-save", "puppeteer@23"], {
  cwd: root,
  stdio: "inherit",
});

if (install.status !== 0) {
  console.error("Failed to install puppeteer.");
  process.exit(1);
}

console.log("Generating PDF…");
const run = spawnSync("node", [tmpScript], { cwd: root, stdio: "inherit" });
try {
  unlinkSync(tmpScript);
} catch {
  /* ignore */
}

process.exit(run.status ?? 1);
