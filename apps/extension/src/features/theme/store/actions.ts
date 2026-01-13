import { atom } from "jotai";
import { themeModeAtom } from "./atoms";

const FAVICON_PATH = "/favicon.svg";

const updateFavicon = () => {
	const head = document.head;
	const oldLink = document.getElementById("favicon");

	if (oldLink) {
		head.removeChild(oldLink);
	}

	const newLink = document.createElement("link");
	newLink.id = "favicon";
	newLink.rel = "icon";
	newLink.type = "image/svg+xml";
	newLink.href = FAVICON_PATH;

	head.appendChild(newLink);
};

export const initThemeAtom = atom(null, (get) => {
	const theme = get(themeModeAtom);
	document.documentElement.classList.toggle("dark", theme === "dark");
	updateFavicon();
});

export const toggleThemeAtom = atom(null, (get, set) => {
	const current = get(themeModeAtom);
	const next = current === "light" ? "dark" : "light";
	set(themeModeAtom, next);
	localStorage.setItem("aura-theme", next);
	document.documentElement.classList.toggle("dark", next === "dark");
	updateFavicon();
});
