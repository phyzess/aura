import { STORAGE_KEYS } from "@aura/config";
import { atom } from "jotai";

const getInitialTheme = (): "light" | "dark" => {
	if (typeof window === "undefined") return "light";
	const saved = localStorage.getItem(STORAGE_KEYS.THEME);
	if (saved === "light" || saved === "dark") return saved;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
};

const initialTheme = getInitialTheme();

export const themeModeAtom = atom<"light" | "dark">(initialTheme);
