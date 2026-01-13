import { atom } from "jotai";

export const syncStatusAtom = atom<"idle" | "syncing" | "success" | "error">(
	"idle",
);
export const syncErrorAtom = atom<string | null>(null);
export const syncDirtyAtom = atom<boolean>(false);
export const lastLocalChangeAtAtom = atom<number | null>(null);
export const syncLastSourceAtom = atom<"auto" | "manual" | null>(null);
export const lastSyncTimestampAtom = atom<number | null>(null);
