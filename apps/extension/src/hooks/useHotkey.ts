import { useEffect } from "react";

interface UseHotkeyOptions {
	ignoreInputs?: boolean;
	enabled?: boolean;
}

const isTextInput = (target: EventTarget | null) => {
	if (!target || !(target instanceof HTMLElement)) return false;
	const tagName = target.tagName;
	return (
		tagName === "INPUT" ||
		tagName === "TEXTAREA" ||
		(target as HTMLElement).isContentEditable
	);
};

export function useHotkey(
	combo: string,
	handler: (event: KeyboardEvent) => void,
	options: UseHotkeyOptions = {},
) {
	const { ignoreInputs = true, enabled = true } = options;

	useEffect(() => {
		if (!enabled) return;

		const parts = combo.toLowerCase().split("+");
		const mainKey = parts[parts.length - 1];

		const hasMod = parts.includes("mod");
		const requireMeta = parts.includes("meta") || parts.includes("cmd");
		const requireCtrl = parts.includes("ctrl") || parts.includes("control");
		const requireAlt = parts.includes("alt") || parts.includes("option");
		const requireShift = parts.includes("shift");

		const listener = (event: KeyboardEvent) => {
			if (ignoreInputs && isTextInput(event.target)) return;

			if (event.key.toLowerCase() !== mainKey) return;

			if (hasMod) {
				if (!(event.metaKey || event.ctrlKey)) return;
			} else {
				if (requireMeta && !event.metaKey) return;
				if (requireCtrl && !event.ctrlKey) return;
			}

			if (requireAlt && !event.altKey) return;
			if (requireShift && !event.shiftKey) return;

			handler(event);
		};

		window.addEventListener("keydown", listener);
		return () => window.removeEventListener("keydown", listener);
	}, [combo, handler, ignoreInputs, enabled]);
}
