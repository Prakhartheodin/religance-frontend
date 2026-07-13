"use client";

import { apiGet, apiSend, type JsonResult } from "./api-client";
import type { DiscoveryMedicine } from "./medicines-master";
import type { SaltMasterItem } from "./salts-master";

/**
 * The shared salt/medicine catalogue. One list for the whole team.
 *
 * GET on boot; every write is per-item. There is deliberately no whole-array
 * save: the old one replaced the caller's entire list server-side and deleted
 * anything absent from the payload, so loading the catalogue and saving it back
 * (which the boot path did, on every login) rewrote all of it under that user's
 * id — and a save of [] wiped it outright.
 */

export const getBackendSalts = (): Promise<JsonResult<SaltMasterItem[]>> =>
  apiGet<SaltMasterItem[]>("/v1/master-data/salts");

export const createBackendSalt = (
  salt: SaltMasterItem
): Promise<JsonResult<SaltMasterItem>> =>
  apiSend<SaltMasterItem>("POST", "/v1/master-data/salts", salt);

export const patchBackendSalt = (
  id: string,
  patch: Partial<Omit<SaltMasterItem, "id">>
): Promise<JsonResult<SaltMasterItem>> =>
  apiSend<SaltMasterItem>(
    "PATCH",
    `/v1/master-data/salts/${encodeURIComponent(id)}`,
    patch
  );

/** 409 if any medicine still points at this salt. */
export const removeBackendSalt = (id: string): Promise<JsonResult<void>> =>
  apiSend<void>("DELETE", `/v1/master-data/salts/${encodeURIComponent(id)}`);

export const getBackendMedicines = (): Promise<JsonResult<DiscoveryMedicine[]>> =>
  apiGet<DiscoveryMedicine[]>("/v1/master-data/medicines");

export const createBackendMedicine = (
  medicine: DiscoveryMedicine
): Promise<JsonResult<DiscoveryMedicine>> =>
  apiSend<DiscoveryMedicine>("POST", "/v1/master-data/medicines", medicine);

export const patchBackendMedicine = (
  id: string,
  patch: Partial<Omit<DiscoveryMedicine, "id">>
): Promise<JsonResult<DiscoveryMedicine>> =>
  apiSend<DiscoveryMedicine>(
    "PATCH",
    `/v1/master-data/medicines/${encodeURIComponent(id)}`,
    patch
  );

export const removeBackendMedicine = (id: string): Promise<JsonResult<void>> =>
  apiSend<void>("DELETE", `/v1/master-data/medicines/${encodeURIComponent(id)}`);
