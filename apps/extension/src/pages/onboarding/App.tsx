import { MESSAGE_TYPES, STORAGE_KEYS } from "@aura/config";
import { useAtomValue, useSetAtom } from "jotai";
import {
	CheckCircle2,
	ExternalLink,
	Github,
	Moon,
	Pin,
	Sparkles,
	Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AuraLogo } from "@/components/AuraLogo";
import { BottomShadow } from "@/components/ui/BottomShadow";
import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { GITHUB_REPO_URL } from "@/config/constants";
import { changeLocale } from "@/config/locale";
import * as m from "@/paraglide/messages";
import { initThemeAtom } from "@/store/actions";
import { localeAtom, themeModeAtom } from "@/store/atoms";
import type { Locale } from "@/types/paraglide";

type OnboardingStep = "welcome" | "newtab" | "pin" | "finish";

export default function App() {
	const locale = useAtomValue(localeAtom);
	const theme = useAtomValue(themeModeAtom);
	const [step, setStep] = useState<OnboardingStep>("welcome");
	const [newTabEnabled, setNewTabEnabled] = useState(false);

	const initTheme = useSetAtom(initThemeAtom);
	const setThemeMode = useSetAtom(themeModeAtom);
	const setLocale = useSetAtom(localeAtom);

	useEffect(() => {
		initTheme();
	}, [initTheme]);

	useEffect(() => {
		const handleStorageChange = (
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string,
		) => {
			if (areaName !== "local") return;

			if (changes[STORAGE_KEYS.THEME]) {
				const newTheme = changes[STORAGE_KEYS.THEME].newValue as
					| "light"
					| "dark";
				setThemeMode(newTheme);
				document.documentElement.classList.toggle("dark", newTheme === "dark");
			}

			if (changes[STORAGE_KEYS.LOCALE]) {
				const newLocale = changes[STORAGE_KEYS.LOCALE].newValue as
					| "en"
					| "zh-CN";
				setLocale(newLocale);
				changeLocale(newLocale);
				// Update HTML lang attribute
				document.documentElement.lang = newLocale;
			}
		};

		chrome.storage.onChanged.addListener(handleStorageChange);
		return () => chrome.storage.onChanged.removeListener(handleStorageChange);
	}, [setThemeMode, setLocale]);

	const handleEnableNewTab = () => {
		setNewTabEnabled(true);
		setStep("pin");
	};

	const handleSkipNewTab = () => {
		setNewTabEnabled(false);
		setStep("pin");
	};

	const handleOpenExtensions = () => {
		chrome.tabs.create({ url: "chrome://extensions" });
	};

	const handleThemeToggle = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setThemeMode(newTheme);
		localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
		document.documentElement.classList.toggle("dark", newTheme === "dark");
		chrome.storage.local.set({ [STORAGE_KEYS.THEME]: newTheme });
	};

	const handleLocaleChange = () => {
		const newLocale: Locale = locale === "en" ? "zh-CN" : "en";
		setLocale(newLocale);
		changeLocale(newLocale);
		localStorage.setItem(STORAGE_KEYS.LOCALE, newLocale);
		chrome.storage.local.set({ [STORAGE_KEYS.LOCALE]: newLocale });
	};

	const handleFinish = async () => {
		await chrome.runtime.sendMessage({
			type: MESSAGE_TYPES.ONBOARDING_COMPLETE,
			data: { newTabEnabled },
		});

		// Close onboarding tab and open dashboard
		const dashboardUrl = chrome.runtime.getURL("pages/dashboard.html");
		await chrome.tabs.create({ url: dashboardUrl });
		window.close();
	};

	return (
		<div className="min-h-screen bg-surface flex flex-col">
			{/* Settings Bar */}
			<header className="fixed top-0 right-0 p-4 flex items-center gap-2 z-50">
				<button
					type="button"
					onClick={handleLocaleChange}
					className="px-3 py-1.5 rounded-full text-xs font-medium text-secondary hover:text-primary hover:bg-surface-muted/60 transition-colors"
					aria-label={m.user_menu_language_label()}
				>
					{locale === "en" ? "中文" : "English"}
				</button>
				<IconButton
					type="button"
					variant="subtle"
					size="sm"
					onClick={() => window.open(GITHUB_REPO_URL, "_blank")}
					aria-label={m.header_github_link_aria()}
					className="hover:text-secondary hover:bg-surface-muted/60"
					title={m.header_github_link_title()}
				>
					<Github size={18} />
				</IconButton>
				<IconButton
					type="button"
					variant="subtle"
					size="sm"
					onClick={handleThemeToggle}
					aria-label={m.header_theme_toggle_aria()}
					className="hover:text-secondary hover:bg-surface-muted/60"
				>
					{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
				</IconButton>
			</header>

			{/* Main Content */}
			<main className="flex-1 flex items-center justify-center p-6">
				<div className="w-full max-w-2xl">
					{/* Welcome Step */}
					{step === "welcome" && (
						<BottomShadow
							size="lg"
							className="rounded-3xl bottom-shadow-subtle"
						>
							<Card
								padding="lg"
								radius="3xl"
								className="relative z-10 text-center space-y-8"
							>
								<div className="flex justify-center">
									<div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center shadow-soft">
										<AuraLogo className="w-12 h-12 text-on-accent" />
									</div>
								</div>
								<div className="space-y-3">
									<h1 className="text-3xl font-bold text-primary">
										{m.onboarding_welcome_title()}
									</h1>
									<p className="text-base text-secondary max-w-md mx-auto">
										{m.onboarding_welcome_subtitle()}
									</p>
								</div>
								<div className="pt-4">
									<Button
										onClick={() => setStep("newtab")}
										variant="primary"
										size="lg"
										className="mx-auto"
									>
										<Sparkles className="w-5 h-5" />
										{m.common_continue()}
									</Button>
								</div>
							</Card>
						</BottomShadow>
					)}

					{/* New Tab Step */}
					{step === "newtab" && (
						<BottomShadow
							size="lg"
							className="rounded-3xl bottom-shadow-subtle"
						>
							<Card
								padding="lg"
								radius="3xl"
								className="relative z-10 space-y-8"
							>
								<div className="space-y-4 text-center">
									<div className="flex justify-center">
										<div className="w-16 h-16 bg-accent-soft rounded-2xl flex items-center justify-center">
											<ExternalLink className="w-8 h-8 text-accent" />
										</div>
									</div>
									<h2 className="text-2xl font-bold text-primary">
										{m.onboarding_newtab_title()}
									</h2>
									<p className="text-secondary text-base max-w-lg mx-auto">
										{m.onboarding_newtab_description()}
									</p>
								</div>
								<div className="flex gap-3 justify-center pt-4">
									<Button
										onClick={handleSkipNewTab}
										variant="outline"
										size="lg"
									>
										{m.onboarding_newtab_skip()}
									</Button>
									<Button
										onClick={handleEnableNewTab}
										variant="primary"
										size="lg"
									>
										{m.onboarding_newtab_enable()}
									</Button>
								</div>
							</Card>
						</BottomShadow>
					)}

					{/* Pin Step */}
					{step === "pin" && (
						<BottomShadow
							size="lg"
							className="rounded-3xl bottom-shadow-subtle"
						>
							<Card
								padding="lg"
								radius="3xl"
								className="relative z-10 space-y-8"
							>
								<div className="space-y-4 text-center">
									<div className="flex justify-center">
										<div className="w-16 h-16 bg-accent-soft rounded-2xl flex items-center justify-center">
											<Pin className="w-8 h-8 text-accent" />
										</div>
									</div>
									<h2 className="text-2xl font-bold text-primary">
										{m.onboarding_pin_title()}
									</h2>
									<p className="text-secondary text-base max-w-lg mx-auto">
										{m.onboarding_pin_description()}
									</p>
								</div>
								<div className="bg-surface-muted rounded-xl p-5 border border-surface">
									<p className="text-secondary text-sm text-center">
										{m.onboarding_pin_instruction()}
									</p>
								</div>
								<div className="flex gap-3 justify-center pt-4">
									<Button
										onClick={handleOpenExtensions}
										variant="outline"
										size="lg"
									>
										<ExternalLink className="w-4 h-4" />
										{m.onboarding_pin_open_extensions()}
									</Button>
									<Button
										onClick={() => setStep("finish")}
										variant="primary"
										size="lg"
									>
										{m.onboarding_pin_done()}
									</Button>
								</div>
							</Card>
						</BottomShadow>
					)}

					{/* Finish Step */}
					{step === "finish" && (
						<BottomShadow
							size="lg"
							className="rounded-3xl bottom-shadow-subtle"
						>
							<Card
								padding="lg"
								radius="3xl"
								className="relative z-10 text-center space-y-8"
							>
								<div className="flex justify-center">
									<div className="w-20 h-20 bg-success-soft rounded-2xl flex items-center justify-center">
										<CheckCircle2 className="w-12 h-12 text-success" />
									</div>
								</div>
								<div className="space-y-3">
									<h1 className="text-3xl font-bold text-primary">
										{m.onboarding_finish_title()}
									</h1>
									<p className="text-base text-secondary max-w-md mx-auto">
										{m.onboarding_finish_description()}
									</p>
								</div>
								<div className="pt-4">
									<Button
										onClick={handleFinish}
										variant="primary"
										size="lg"
										className="mx-auto"
									>
										<Sparkles className="w-5 h-5" />
										{m.onboarding_finish_button()}
									</Button>
								</div>
							</Card>
						</BottomShadow>
					)}
				</div>
			</main>
		</div>
	);
}
