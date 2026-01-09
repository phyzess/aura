import { STORAGE_KEYS } from "@aura/config";
import { atom } from "jotai";
import type { Locale } from "@/types/paraglide";

const getInitialLocale = (): Locale => {
	if (typeof window === "undefined") return "en";

	const stored = window.localStorage.getItem(STORAGE_KEYS.LOCALE);
	if (stored === "en" || stored === "zh-CN") return stored;

	const nav =
		window.navigator.language || window.navigator.languages?.[0] || "";
	if (nav.toLowerCase().startsWith("zh")) return "zh-CN";

	return "en";
};

const initialLocale = getInitialLocale();

export const localeAtom = atom<Locale>(initialLocale);

