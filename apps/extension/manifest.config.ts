import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
	manifest_version: 3,
	name: "AURA",
	version: pkg.version,
	icons: {
		48: "public/logo.png",
	},
	action: {
		default_icon: {
			48: "public/logo.png",
		},
		default_popup: "src/popup/index.html",
	},
	background: {
		service_worker: "src/background/index.ts",
		type: "module",
	},
	chrome_url_overrides: {
		newtab: "pages/newtab.html",
	},
	options_page: "pages/options.html",
	permissions: ["tabs", "notifications", "storage", "contextMenus"],
	host_permissions: [
		"http://localhost:8787/*",
		"https://aura-api.phyzess.me/*",
	],
	web_accessible_resources: [
		{
			resources: ["pages/dashboard.html"],
			matches: ["<all_urls>"],
		},
	],
});
