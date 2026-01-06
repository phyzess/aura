import { atom } from "jotai";
import type { Collection, TabItem, User, Workspace } from "@/types";
import type { Locale } from "@/types/paraglide";

const getInitialTheme = (): "light" | "dark" => {
	if (typeof window === "undefined") return "light";
	const saved = localStorage.getItem("aura-theme");
	if (saved === "light" || saved === "dark") return saved;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
};

const initialTheme = getInitialTheme();

const getInitialLocale = (): Locale => {
	if (typeof window === "undefined") return "en";

	const stored = window.localStorage.getItem("aura-locale");
	if (stored === "en" || stored === "zh-CN") return stored;

	const nav =
		window.navigator.language || window.navigator.languages?.[0] || "";
	if (nav.toLowerCase().startsWith("zh")) return "zh-CN";

	return "en";
};

const initialLocale = getInitialLocale();

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

export const themeModeAtom = atom<"light" | "dark">(initialTheme);

export const localeAtom = atom<Locale>(initialLocale);

export const workspacesAtom = atom<Workspace[]>([]);
export const collectionsAtom = atom<Collection[]>([]);
export const tabsAtom = atom<TabItem[]>([]);
export const currentUserAtom = atom<User | null>(null);
export const authStatusAtom = atom<"idle" | "signingOut">("idle");
export const authErrorAtom = atom<string | null>(null);

export const activeWorkspaceIdAtom = atom<string | null>(null);

export const syncStatusAtom = atom<"idle" | "syncing" | "success" | "error">(
	"idle",
);

export const syncErrorAtom = atom<string | null>(null);

export const syncDirtyAtom = atom<boolean>(false);

export const lastLocalChangeAtAtom = atom<number | null>(null);

export const syncLastSourceAtom = atom<"auto" | "manual" | null>(null);

export const lastSyncTimestampAtom = atom<number | null>(null);
