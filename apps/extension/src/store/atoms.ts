import { atom } from "jotai";
import type { Collection, TabItem, User, Workspace } from "@/types";

const getInitialTheme = (): "light" | "dark" => {
	if (typeof window === "undefined") return "light";
	const saved = localStorage.getItem("aura-theme");
	if (saved === "light" || saved === "dark") return saved;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
};

const initialTheme = getInitialTheme();

export const isLoadingAtom = atom<boolean>(true);

export const themeModeAtom = atom<"light" | "dark">(initialTheme);

export const workspacesAtom = atom<Workspace[]>([]);
export const collectionsAtom = atom<Collection[]>([]);
export const tabsAtom = atom<TabItem[]>([]);
export const currentUserAtom = atom<User | null>(null);
export const authStatusAtom = atom<"idle" | "signingOut">("idle");
export const authErrorAtom = atom<string | null>(null);

export const activeWorkspaceIdAtom = atom<string | null>(null);
