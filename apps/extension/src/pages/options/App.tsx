import { STORAGE_KEYS } from "@aura/config";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LogManager } from "@/components/LogManager";
import { AuraLogo } from "@/components/shared";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { changeLocale } from "@/config/locale";
import {
	currentUserAtom,
	initDataAtom,
	initThemeAtom,
	isLoadingAtom,
	loadCurrentUserAtom,
	localeAtom,
	themeModeAtom,
} from "@/features";
import * as m from "@/paraglide/messages";
import { locales } from "@/paraglide/runtime";

export default function App() {
	const currentLocale = useAtomValue(localeAtom);
	const isLoading = useAtomValue(isLoadingAtom);
	const currentUser = useAtomValue(currentUserAtom);
	const themeMode = useAtomValue(themeModeAtom);
	const setThemeMode = useSetAtom(themeModeAtom);
	const setLocale = useSetAtom(localeAtom);

	const initData = useSetAtom(initDataAtom);
	const initTheme = useSetAtom(initThemeAtom);
	const loadCurrentUser = useSetAtom(loadCurrentUserAtom);

	const [newTabEnabled, setNewTabEnabled] = useState(true);
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);

	useEffect(() => {
		initData();
		initTheme();
		loadCurrentUser();
	}, [initData, initTheme, loadCurrentUser]);

	useEffect(() => {
		const loadSettings = async () => {
			const result = await chrome.storage.local.get([
				STORAGE_KEYS.NEWTAB_ENABLED,
				"notificationsEnabled",
			]);
			setNewTabEnabled(
				(result[STORAGE_KEYS.NEWTAB_ENABLED] as boolean) ?? false,
			);
			setNotificationsEnabled((result.notificationsEnabled as boolean) ?? true);
		};
		loadSettings();
	}, []);

	const handleThemeChange = (value: string) => {
		const newTheme = value as "light" | "dark";
		setThemeMode(newTheme);
		localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
		document.documentElement.classList.toggle("dark", newTheme === "dark");

		// 通知其他页面主题已更改
		chrome.storage.local.set({ [STORAGE_KEYS.THEME]: newTheme });

		toast.success(m.options_theme_changed());
	};

	const handleLanguageChange = (value: string) => {
		const locale = value as "en" | "zh-CN";
		changeLocale(locale);
		setLocale(locale);

		// 通知其他页面语言已更改
		chrome.storage.local.set({ [STORAGE_KEYS.LOCALE]: locale });

		toast.success(m.options_language_changed());
	};

	const handleNewTabToggle = async () => {
		const newValue = !newTabEnabled;
		setNewTabEnabled(newValue);
		await chrome.storage.local.set({ [STORAGE_KEYS.NEWTAB_ENABLED]: newValue });
		toast.success(
			newValue ? m.options_newtab_enabled() : m.options_newtab_disabled(),
		);
	};

	const handleNotificationsToggle = async () => {
		const newValue = !notificationsEnabled;
		setNotificationsEnabled(newValue);
		await chrome.storage.local.set({ notificationsEnabled: newValue });
		toast.success(
			newValue
				? m.options_notifications_enabled()
				: m.options_notifications_disabled(),
		);
	};

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-cloud-50 dark:bg-cloud-950">
				<div className="text-cloud-600 dark:text-cloud-400">
					{m.dashboard_loading()}
				</div>
			</div>
		);
	}

	const languageOptions = locales.map((tag) => ({
		value: tag,
		label: tag === "en" ? "English" : "中文",
	}));

	const themeOptions = [
		{ value: "light", label: m.options_theme_light() },
		{ value: "dark", label: m.options_theme_dark() },
	];

	return (
		<div
			className={`min-h-screen bg-surface ${themeMode === "dark" ? "dark" : ""}`}
		>
			<div className="max-w-4xl mx-auto p-8">
				<div className="flex items-center gap-4 mb-8">
					<AuraLogo size={48} />
					<div>
						<h1 className="text-3xl font-bold text-primary">
							{m.options_title()}
						</h1>
						<p className="text-sm text-secondary">{m.options_subtitle()}</p>
					</div>
				</div>

				<div className="space-y-6">
					<Card padding="lg" border={false}>
						<CardHeader className="mb-4">
							<h2 className="text-xl font-semibold text-primary">
								{m.options_appearance_title()}
							</h2>
						</CardHeader>
						<CardBody className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<label className="text-sm font-medium text-primary">
										{m.options_theme_label()}
									</label>
									<p className="text-xs text-secondary">
										{m.options_theme_description()}
									</p>
								</div>
								<Select
									value={themeMode}
									onChange={handleThemeChange}
									options={themeOptions}
								/>
							</div>
						</CardBody>
					</Card>

					<Card padding="lg" border={false}>
						<CardHeader className="mb-4">
							<h2 className="text-xl font-semibold text-primary">
								{m.options_language_title()}
							</h2>
						</CardHeader>
						<CardBody className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<label className="text-sm font-medium text-primary">
										{m.options_language_label()}
									</label>
									<p className="text-xs text-secondary">
										{m.options_language_description()}
									</p>
								</div>
								<Select
									value={currentLocale}
									onChange={handleLanguageChange}
									options={languageOptions}
								/>
							</div>
						</CardBody>
					</Card>

					<Card padding="lg" border={false}>
						<CardHeader className="mb-4">
							<h2 className="text-xl font-semibold text-primary">
								{m.options_features_title()}
							</h2>
						</CardHeader>
						<CardBody className="space-y-6">
							<div className="flex items-center justify-between">
								<div>
									<label className="text-sm font-medium text-primary">
										{m.options_newtab_label()}
									</label>
									<p className="text-xs text-secondary">
										{m.options_newtab_description()}
									</p>
								</div>
								<Toggle
									checked={newTabEnabled}
									onChange={handleNewTabToggle}
									label={m.options_newtab_label()}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<label className="text-sm font-medium text-primary">
										{m.options_notifications_label()}
									</label>
									<p className="text-xs text-secondary">
										{m.options_notifications_description()}
									</p>
								</div>
								<Toggle
									checked={notificationsEnabled}
									onChange={handleNotificationsToggle}
									label={m.options_notifications_label()}
								/>
							</div>
						</CardBody>
					</Card>

					{currentUser && (
						<Card padding="lg" border={false}>
							<CardHeader className="mb-4">
								<h2 className="text-xl font-semibold text-primary">
									{m.options_account_title()}
								</h2>
							</CardHeader>
							<CardBody className="space-y-3">
								<div className="text-sm">
									<span className="text-secondary">
										{m.options_account_email()}:{" "}
									</span>
									<span className="text-primary font-medium">
										{currentUser.email}
									</span>
								</div>
								<div className="text-sm">
									<span className="text-secondary">
										{m.options_account_name()}:{" "}
									</span>
									<span className="text-primary font-medium">
										{currentUser.name}
									</span>
								</div>
							</CardBody>
						</Card>
					)}

					<Card padding="lg" border={false}>
						<CardHeader className="mb-4">
							<h2 className="text-xl font-semibold text-primary">
								Developer Tools
							</h2>
						</CardHeader>
						<CardBody>
							<LogManager />
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);
}
