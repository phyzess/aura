// Background service worker for Aura extension
// Handles installation events and onboarding flow

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install") {
		// First time installation
		handleFirstInstall();
	} else if (details.reason === "update") {
		// Extension updated
		console.log(
			"Aura extension updated to version",
			chrome.runtime.getManifest().version,
		);
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
