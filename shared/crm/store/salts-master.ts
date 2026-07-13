/** A row in the shared salt catalogue. No owner — one list for the whole team. */
export type SaltMasterItem = {
  id: string;
  name: string;
};

export function createBlankSalt(id: string): SaltMasterItem {
  return {
    id,
    name: "Untitled salt",
  };
}

// Removed: DEFAULT_SALTS / cloneDefaultSalts / getDefaultSalt / isDefaultSalt.
// They were stubs — isDefaultSalt() always returned false, getDefaultSalt()
// always returned undefined — so the "built-in vs custom" distinction they
// implied never existed (every salt rendered as "Custom"), resetSalt() was a
// permanent no-op, and resetAllSalts() emptied the list, which the whole-array
// PUT then turned into a deleteMany of the entire catalogue.
