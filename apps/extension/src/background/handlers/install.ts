export const handleFirstInstall = async (): Promise<void> => {
	console.log("Aura extension installed for the first time");

	await chrome.storage.local.set({
		"aura-onboarding-completed": false,
		"aura-newtab-enabled": false,
	});

	const onboardingUrl = chrome.runtime.getURL("pages/onboarding.html");
	await chrome.tabs.create({ url: onboardingUrl });
};

export const handleUpdate = async (
	currentVersion: string,
	previousVersion: string | undefined,
): Promise<void> => {
	console.log(
		`Aura extension updated from ${previousVersion} to ${currentVersion}`,
	);

	await chrome.storage.local.set({
		"aura-last-version": currentVersion,
		"aura-changelog-seen": false,
	});
};

export const handleOnboardingComplete = async (data: {
	newTabEnabled: boolean;
}): Promise<void> => {
	await chrome.storage.local.set({
		"aura-onboarding-completed": true,
		"aura-newtab-enabled": data.newTabEnabled,
	});

	console.log("Onboarding completed", data);
};

