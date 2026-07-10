"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import type { IStaticMethods } from "preline/preline";

declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}

/** Preline HSTabs throws if a tab group has no `.active` toggle. */
function ensureTabDefaults() {
  const groups = new Map<Element, HTMLElement[]>();

  document.querySelectorAll<HTMLElement>("[data-hs-tab]").forEach((tab) => {
    const root =
      tab.closest('[role="tablist"]') ??
      tab.parentElement?.closest("nav") ??
      tab.parentElement;
    if (!root) return;

    const list = groups.get(root) ?? [];
    list.push(tab);
    groups.set(root, list);
  });

  groups.forEach((tabs) => {
    if (!tabs.some((tab) => tab.classList.contains("active"))) {
      tabs[0]?.classList.add("active");
    }
  });
}

function safeAutoInit() {
  if (typeof window === "undefined" || !window.HSStaticMethods?.autoInit) {
    return;
  }

  try {
    ensureTabDefaults();
    window.HSStaticMethods.autoInit();
  } catch (error) {
    console.warn("Preline autoInit skipped:", error);
  }
}

export default function PrelineScript() {
  const path = usePathname();
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      if (!loadedRef.current) {
        await import("preline/preline");
        loadedRef.current = true;
      }

      if (cancelled) return;

      // Wait for React to commit route DOM before Preline scans the page.
      requestAnimationFrame(() => {
        if (cancelled) return;
        setTimeout(safeAutoInit, 0);
      });
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return null;
}
