import { MESSAGE_TYPES } from "@aura/config";
import { initializeLogger } from "@/config/logger";
import {
	handleContextMenuClick,
	setupContextMenus,
} from "./handlers/context-menu";
import {
	handleFirstInstall,
	handleOnboardingComplete,
	handleUpdate,
} from "./handlers/install";
import { preloadAll } from "./handlers/preload";

// Initialize logger
initializeLogger().catch((error) => {
	console.error("[Background] Failed to initialize logger:", error);
});

// Preload data on extension startup
preloadAll().catch((error) => {
	console.error("[Background] Failed to preload data:", error);
});

chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason === "install") {
		await handleFirstInstall();
		setupContextMenus();
		// Preload data after installation
		await preloadAll();
	} else if (details.reason === "update") {
		const currentVersion = chrome.runtime.getManifest().version;
		const previousVersion = details.previousVersion;
		await handleUpdate(currentVersion, previousVersion);
		setupContextMenus();
		// Preload data after update
		await preloadAll();
	}
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === MESSAGE_TYPES.ONBOARDING_COMPLETE) {
		handleOnboardingComplete(message.data);
		sendResponse({ success: true });
	}
	return true;
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	await handleContextMenuClick(info, tab);
});
