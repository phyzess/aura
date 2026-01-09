import { atom } from "jotai";

export type LoadingStage =
	| "idle"
	| "initializing"
	| "loading-db"
	| "loading-user"
	| "syncing"
	| "ready";

export const isLoadingAtom = atom<boolean>(true);
export const loadingStageAtom = atom<LoadingStage>("initializing");
export const loadingMessageAtom = atom<string | null>(null);

