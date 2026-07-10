import { basePath } from "@/next.config";

function brandFile(name: string) {
  const bp = process.env.NODE_ENV === "production" ? basePath : "";
  return `${bp}/assets/images/brand-logos/${name}`;
}

/** Religence hex mark — used with adjacent "religence" wordmark in UI */
export const religenceIcon = brandFile("religence-icon.png");

/** @deprecated Use religenceIcon + BrandLogo component */
export const espandaFull = religenceIcon;
/** @deprecated Use religenceIcon + BrandLogo component */
export const espandaIcon = religenceIcon;
/** @deprecated Use religenceIcon + BrandLogo component */
export const espandaFullDark = religenceIcon;
/** @deprecated Use religenceIcon + BrandLogo component */
export const espandaIconDark = religenceIcon;

/** @deprecated Use religenceIcon */
export function espandaBrandForTheme(_themeClass: string | undefined) {
  return {
    full: religenceIcon,
    icon: religenceIcon,
  };
}
