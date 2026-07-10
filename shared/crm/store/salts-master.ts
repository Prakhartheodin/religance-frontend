import { SALT_MASTER_LIST, type SaltMasterItem } from "../lead-discovery/salts";

export type { SaltMasterItem };

export const DEFAULT_SALTS: SaltMasterItem[] = SALT_MASTER_LIST;

export function cloneDefaultSalts(): SaltMasterItem[] {
  return SALT_MASTER_LIST.map((s) => ({ ...s }));
}

export function getDefaultSalt(id: string): SaltMasterItem | undefined {
  return SALT_MASTER_LIST.find((s) => s.id === id);
}

export function isDefaultSalt(id: string): boolean {
  return SALT_MASTER_LIST.some((s) => s.id === id);
}

export function createBlankSalt(id: string): SaltMasterItem {
  return {
    id,
    name: "Untitled salt",
  };
}
