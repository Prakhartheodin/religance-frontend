export type SaltMasterItem = {
  id: string;
  name: string;
};

/** Salts are loaded from Excel via /v1/master-data — no static defaults. */
export const DEFAULT_SALTS: SaltMasterItem[] = [];

export function cloneDefaultSalts(): SaltMasterItem[] {
  return [];
}

export function getDefaultSalt(_id: string): SaltMasterItem | undefined {
  return undefined;
}

export function isDefaultSalt(_id: string): boolean {
  return false;
}

export function createBlankSalt(id: string): SaltMasterItem {
  return {
    id,
    name: "Untitled salt",
  };
}
