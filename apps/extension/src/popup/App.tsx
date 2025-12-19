import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { ChromeService } from "@/services/chrome";
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
	tabsAtom,
	workspacesAtom,
} from "@/store/atoms";
import { ExtensionPopup } from "./components/ExtensionPopup";

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

	useEffect(() => {
		initData();
		initTheme();
		loadCurrentUser();
	}, [initData, initTheme, loadCurrentUser]);

	const handleCapture = (payload: any) => {
		captureSession(payload);
	};

	const openDashboard = (options?: { openAuth?: boolean }) => {
		const baseUrl = ChromeService.isExtension()
			? chrome.runtime.getURL("src/pages/dashboard/index.html")
			: "http://localhost:5173/src/pages/dashboard/index.html";

		const dashboardUrl = options?.openAuth ? `${baseUrl}?auth=1` : baseUrl;

		ChromeService.openTab(dashboardUrl);

		if (ChromeService.isExtension()) {
			window.close();
		}
	};

	const handleClose = () => {
		openDashboard();
	};

	const handleOpenAuth = () => {
		openDashboard({ openAuth: true });
	};

	if (isLoading) {
		return (
			<div className="w-100 h-150 flex items-center justify-center bg-cloud-50 dark:bg-cloud-950">
				<div className="text-cloud-600 dark:text-cloud-400">Loading...</div>
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
			onOpenAuth={handleOpenAuth}
		/>
	);
}
