import { MESSAGE_TYPES } from "@aura/config";
import {
	handleContextMenuClick,
	setupContextMenus,
} from "./handlers/context-menu";
import {
	handleFirstInstall,
	handleOnboardingComplete,
	handleUpdate,
} from "./handlers/install";

chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason === "install") {
		await handleFirstInstall();
		setupContextMenus();
	} else if (details.reason === "update") {
		const currentVersion = chrome.runtime.getManifest().version;
		const previousVersion = details.previousVersion;
		await handleUpdate(currentVersion, previousVersion);
		setupContextMenus();
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
