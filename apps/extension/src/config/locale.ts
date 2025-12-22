import { setLocale } from "@/paraglide/runtime";
import type { Locale } from "@/types/paraglide";

const STORAGE_KEY = "aura-locale";
const DEFAULT_LOCALE: Locale = "en";

const isSupportedLocale = (
	value: string | null | undefined,
): value is Locale => {
	return value === "en" || value === "zh-CN";
};

const detectLocale = (): Locale => {
	if (typeof window === "undefined") return DEFAULT_LOCALE;

	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (isSupportedLocale(stored)) return stored;

	const nav =
		window.navigator.language || window.navigator.languages?.[0] || "";
	if (nav.toLowerCase().startsWith("zh")) return "zh-CN";

	return DEFAULT_LOCALE;
};

export const initLocale = (): Locale => {
	const next = detectLocale();

	void setLocale(next, { reload: false });

	if (typeof window !== "undefined") {
		window.localStorage.setItem(STORAGE_KEY, next);
	}

	return next;
};

export const changeLocale = (locale: Locale): void => {
	if (!isSupportedLocale(locale)) return;

	if (typeof window !== "undefined") {
		window.localStorage.setItem(STORAGE_KEY, locale);
	}

	void setLocale(locale, { reload: false });
};
