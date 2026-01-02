import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { changeLocale } from "@/config/locale";
import * as m from "@/paraglide/messages";
import { ChromeService } from "@/services/chrome";
import { offlineDetector } from "@/services/offlineDetector";
import {
	captureSessionAtom,
	initDataAtom,
	initThemeAtom,
	loadCurrentUserAtom,
} from "@/store/actions";
import {
	collectionsAtom,
	currentUserAtom,
	isLoadingAtom,
	localeAtom,
	tabsAtom,
	themeModeAtom,
	workspacesAtom,
} from "@/store/atoms";
import { ExtensionPopup } from "./components/ExtensionPopup";

interface SaveRequest {
	mode: "current-tab" | "link" | "all-tabs";
	timestamp: number;
	data?: {
		url?: string;
		title?: string;
		favicon?: string;
	};
}

export default function App() {
	const isLoading = useAtomValue(isLoadingAtom);
	const workspaces = useAtomValue(workspacesAtom);
	const collections = useAtomValue(collectionsAtom);
	const tabs = useAtomValue(tabsAtom);
	const currentUser = useAtomValue(currentUserAtom);

	const initData = useSetAtom(initDataAtom);
	const initTheme = useSetAtom(initThemeAtom);
	const loadCurrentUser = useSetAtom(loadCurrentUserAtom);
	const captureSession = useSetAtom(captureSessionAtom);
	const setThemeMode = useSetAtom(themeModeAtom);
	const setLocale = useSetAtom(localeAtom);

	const [saveRequest, setSaveRequest] = useState<SaveRequest | null>(null);

	useEffect(() => {
		initData();
		initTheme();
		loadCurrentUser();

		// Initialize offline detector
		offlineDetector.getStatus();

		// Check for save request from context menu
		checkSaveRequest();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 监听设置变化
	useEffect(() => {
		const handleStorageChange = (
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string,
		) => {
			if (areaName !== "local") return;

			if (changes["aura-theme"]) {
				const newTheme = changes["aura-theme"].newValue as "light" | "dark";
				setThemeMode(newTheme);
				document.documentElement.classList.toggle("dark", newTheme === "dark");
			}

			if (changes["aura-locale"]) {
				const newLocale = changes["aura-locale"].newValue as "en" | "zh-CN";
				setLocale(newLocale);
				changeLocale(newLocale);
			}
		};

		chrome.storage.onChanged.addListener(handleStorageChange);
		return () => chrome.storage.onChanged.removeListener(handleStorageChange);
	}, []);

	const handleCapture = (payload: any) => {
		captureSession(payload);
	};

	const openDashboard = (options?: { openAuth?: boolean }) => {
		const baseUrl = ChromeService.isExtension()
			? chrome.runtime.getURL("pages/dashboard.html")
			: "http://localhost:5173/pages/dashboard.html";

		const dashboardUrl = options?.openAuth ? `${baseUrl}?auth=1` : baseUrl;

		ChromeService.openTab(dashboardUrl);

		if (ChromeService.isExtension()) {
			window.close();
		}
	};

	const handleClose = () => {
		openDashboard();
	};

	const checkSaveRequest = async () => {
		const result = await chrome.storage.local.get("aura-save-request");
		const request = result["aura-save-request"] as SaveRequest | undefined;

		if (request && Date.now() - request.timestamp < 5000) {
			// Request is fresh (within 5 seconds)
			setSaveRequest(request);
			// Clear the request
			await chrome.storage.local.remove("aura-save-request");
		}
	};

	if (isLoading) {
		return (
			<div className="w-100 h-150 flex items-center justify-center bg-cloud-50 dark:bg-cloud-950">
				<div className="text-cloud-600 dark:text-cloud-400">
					{m.popup_loading()}
				</div>
			</div>
		);
	}

	return (
		<ExtensionPopup
			workspaces={workspaces}
			collections={collections}
			tabs={tabs}
			currentUser={currentUser}
			onCapture={handleCapture}
			onClose={handleClose}
			saveRequest={saveRequest}
		/>
	);
}
