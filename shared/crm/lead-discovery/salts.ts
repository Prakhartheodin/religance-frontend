export type SaltMasterItem = {
  id: string;
  name: string;
};

/** Salts load from Excel via /v1/master-data — see useCrm().salts */
export const SALT_MASTER_LIST: SaltMasterItem[] = [];
