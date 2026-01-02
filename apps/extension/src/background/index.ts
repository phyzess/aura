// Background service worker for Aura extension
// Handles installation events, onboarding flow, context menus, and version updates

chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason === "install") {
		// First time installation
		await handleFirstInstall();
		setupContextMenus();
	} else if (details.reason === "update") {
		// Extension updated
		const currentVersion = chrome.runtime.getManifest().version;
		const previousVersion = details.previousVersion;

		console.log(
			`Aura extension updated from ${previousVersion} to ${currentVersion}`,
		);

		// Setup context menus on update
		setupContextMenus();

		// Record version update for changelog display
		await chrome.storage.local.set({
			"aura-last-version": currentVersion,
			"aura-changelog-seen": false,
		});
	}
});

async function handleFirstInstall() {
	console.log("Aura extension installed for the first time");

	// Set default preferences
	await chrome.storage.local.set({
		"aura-onboarding-completed": false,
		"aura-newtab-enabled": false, // Disabled by default, user needs to opt-in
	});

	// Open onboarding page
	const onboardingUrl = chrome.runtime.getURL("pages/onboarding.html");
	await chrome.tabs.create({ url: onboardingUrl });
}

// Listen for messages from onboarding page
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === "onboarding-complete") {
		handleOnboardingComplete(message.data);
		sendResponse({ success: true });
	}
	return true;
});

async function handleOnboardingComplete(data: { newTabEnabled: boolean }) {
	await chrome.storage.local.set({
		"aura-onboarding-completed": true,
		"aura-newtab-enabled": data.newTabEnabled,
	});

	console.log("Onboarding completed", data);
}

// ============================================
// Context Menus
// ============================================

function setupContextMenus() {
	// Remove all existing menus first
	chrome.contextMenus.removeAll(() => {
		// Parent menu
		chrome.contextMenus.create({
			id: "aura-main",
			title: "Aura",
			contexts: ["page", "link", "selection"],
		});

		// Save current tab
		chrome.contextMenus.create({
			id: "save-current-tab",
			parentId: "aura-main",
			title: "Save current tab",
			contexts: ["page"],
		});

		// Save link
		chrome.contextMenus.create({
			id: "save-link",
			parentId: "aura-main",
			title: "Save this link",
			contexts: ["link"],
		});

		// Save all tabs in window
		chrome.contextMenus.create({
			id: "save-all-tabs",
			parentId: "aura-main",
			title: "Save all tabs in window",
			contexts: ["page"],
		});

		// Separator
		chrome.contextMenus.create({
			id: "separator-1",
			parentId: "aura-main",
			type: "separator",
			contexts: ["page", "link"],
		});

		// Open Dashboard
		chrome.contextMenus.create({
			id: "open-dashboard",
			parentId: "aura-main",
			title: "Open Dashboard",
			contexts: ["page", "link"],
		});
	});
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	switch (info.menuItemId) {
		case "save-current-tab":
			if (tab) {
				await openPopupWithSaveMode("current-tab", tab);
			}
			break;

		case "save-link":
			if (info.linkUrl && tab) {
				await openPopupWithSaveMode("link", tab, info.linkUrl);
			}
			break;

		case "save-all-tabs":
			await openPopupWithSaveMode("all-tabs");
			break;

		case "open-dashboard":
			await openDashboard();
			break;
	}
});

/**
 * Open popup and trigger save mode via storage
 */
async function openPopupWithSaveMode(
	mode: "current-tab" | "link" | "all-tabs",
	tab?: chrome.tabs.Tab,
	linkUrl?: string,
) {
	// Store the save request in storage for popup to read
	const saveRequest = {
		mode,
		timestamp: Date.now(),
		data:
			mode === "current-tab" && tab
				? {
						url: tab.url,
						title: tab.title,
						favicon: tab.favIconUrl,
					}
				: mode === "link" && linkUrl
					? {
							url: linkUrl,
							title: extractTitleFromUrl(linkUrl),
							favicon: `https://www.google.com/s2/favicons?domain=${new URL(linkUrl).hostname}&sz=64`,
						}
					: null,
	};

	await chrome.storage.local.set({ "aura-save-request": saveRequest });

	// Open popup (or focus if already open)
	await chrome.action.openPopup();
}

function extractTitleFromUrl(url: string): string {
	try {
		const domain = new URL(url).hostname.replace("www.", "");
		return domain;
	} catch {
		return "Saved Link";
	}
}

async function openDashboard() {
	const dashboardUrl = chrome.runtime.getURL("pages/dashboard.html");

	// Check if dashboard is already open
	const tabs = await chrome.tabs.query({ url: dashboardUrl });

	if (tabs.length > 0 && tabs[0].id) {
		// Focus existing dashboard tab
		await chrome.tabs.update(tabs[0].id, { active: true });
		if (tabs[0].windowId) {
			await chrome.windows.update(tabs[0].windowId, { focused: true });
		}
	} else {
		// Create new dashboard tab
		await chrome.tabs.create({ url: dashboardUrl });
	}
}
