import { STORAGE_KEYS } from "@aura/config";

export const handleFirstInstall = async (): Promise<void> => {
	console.log("Aura extension installed for the first time");

	await chrome.storage.local.set({
		[STORAGE_KEYS.ONBOARDING_COMPLETED]: false,
		[STORAGE_KEYS.NEWTAB_ENABLED]: false,
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
		[STORAGE_KEYS.LAST_VERSION]: currentVersion,
		[STORAGE_KEYS.CHANGELOG_SEEN]: false,
	});
};

export const handleOnboardingComplete = async (data: {
	newTabEnabled: boolean;
}): Promise<void> => {
	await chrome.storage.local.set({
		[STORAGE_KEYS.ONBOARDING_COMPLETED]: true,
		[STORAGE_KEYS.NEWTAB_ENABLED]: data.newTabEnabled,
	});

	console.log("Onboarding completed", data);
};
