#!/bin/bash
# Generate Religence CRM User Guide PDF from HTML
# Requires Google Chrome or Chromium

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML="file://${ROOT}/docs/religence-user-guide.html"
PDF="${ROOT}/docs/Religence-CRM-User-Guide.pdf"

CHROME=""
for candidate in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "google-chrome" \
  "chromium" \
  "chromium-browser"; do
  if command -v "$candidate" &>/dev/null || [ -x "$candidate" ]; then
    CHROME="$candidate"
    break
  fi
done

if [ -z "$CHROME" ]; then
  echo "Chrome/Chromium not found."
  echo "Open docs/religence-user-guide.html in a browser → Print → Save as PDF."
  exit 1
fi

"$CHROME" \
  --headless=new \
  --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="$PDF" \
  "$HTML"

echo "PDF written: $PDF"
