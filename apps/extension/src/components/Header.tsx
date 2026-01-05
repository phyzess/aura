import { useAtomValue, useSetAtom } from "jotai";
import {
	Github,
	Moon,
	Search as SearchIcon,
	Sparkles,
	Sun,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { ChangelogDialog } from "@/components/ChangelogDialog";
import { OpenTabsButton } from "@/components/OpenTabsButton";
import { BottomShadow } from "@/components/ui/BottomShadow";
import { IconButton } from "@/components/ui/IconButton";
import { ShortcutHint } from "@/components/ui/ShortcutHint";
import { GITHUB_REPO_URL } from "@/config/constants";
import { changeLocale } from "@/config/locale";
import * as m from "@/paraglide/messages";
import { toggleThemeAtom } from "@/store/actions";
import { localeAtom, themeModeAtom } from "@/store/atoms";
import type { Locale } from "@/types/paraglide";

interface HeaderProps {
	workspaceName: string;
	onOpenSearch?: () => void;
	workspaceTabsCount?: number;
	workspaceCollectionsCount?: number;
	getWorkspaceUrlsInDisplayOrder?: () => string[];
	workspaceRestoreConfirmThreshold?: number;
}

export const Header: React.FC<HeaderProps> = ({
	workspaceName,
	onOpenSearch,
	workspaceTabsCount,
	workspaceCollectionsCount,
	getWorkspaceUrlsInDisplayOrder,
	workspaceRestoreConfirmThreshold,
}) => {
	const theme = useAtomValue(themeModeAtom);
	const toggleTheme = useSetAtom(toggleThemeAtom);
	const locale = useAtomValue(localeAtom);
	const setLocale = useSetAtom(localeAtom);

	const [showNewBadge, setShowNewBadge] = useState(false);
	const [changelogOpen, setChangelogOpen] = useState(false);
	const currentVersion = chrome.runtime.getManifest().version;

	const checkChangelogStatus = useCallback(async () => {
		const result = await chrome.storage.local.get([
			"aura-last-version",
			"aura-changelog-seen",
		]);

		if (
			result["aura-last-version"] === currentVersion &&
			result["aura-changelog-seen"] === false
		) {
			setShowNewBadge(true);
		}
	}, [currentVersion]);

	useEffect(() => {
		checkChangelogStatus();
	}, [checkChangelogStatus]);

	const handleOpenChangelog = async () => {
		setChangelogOpen(true);
		await chrome.storage.local.set({ "aura-changelog-seen": true });
		setShowNewBadge(false);
	};

	const handleCloseChangelog = () => {
		setChangelogOpen(false);
	};

	const handleLocaleChange = (next: Locale) => {
		setLocale(next);
		changeLocale(next);
	};

	return (
		<header className="px-4 sm:px-6 md:px-8 pt-4 pb-3 flex flex-col gap-3 shrink-0 z-10">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold text-primary tracking-tight transition-colors">
						{workspaceName}
					</h2>
					{workspaceTabsCount !== undefined && workspaceTabsCount > 0 && (
						<div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-secondary">
							<span className="text-sm text-secondary">
								{workspaceTabsCount} tabs · {workspaceCollectionsCount ?? 0}{" "}
								collections
							</span>
							{getWorkspaceUrlsInDisplayOrder && (
								<div className="inline-flex items-center gap-1 px-2 py-0.5">
									<OpenTabsButton
										mode="current"
										scope="workspace"
										getUrls={getWorkspaceUrlsInDisplayOrder}
										confirmThreshold={workspaceRestoreConfirmThreshold}
									/>
									<span className="mx-1 text-[10px] text-muted">·</span>
									<OpenTabsButton
										mode="new-window"
										scope="workspace"
										getUrls={getWorkspaceUrlsInDisplayOrder}
										confirmThreshold={workspaceRestoreConfirmThreshold}
									/>
								</div>
							)}
						</div>
					)}
				</div>
				<div className="flex items-center gap-3 sm:gap-4">
					{onOpenSearch && (
						<>
							<BottomShadow
								size="sm"
								className="hidden md:inline-flex rounded-xl bottom-shadow-subtle"
							>
								<button
									type="button"
									onClick={onOpenSearch}
									className="relative z-10 inline-flex items-center gap-2 px-3 py-1.5 bg-surface-elevated rounded-xl border border-surface-border/80 text-xs font-medium text-muted transition-colors hover:border-surface-border hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-cyan"
									aria-label={m.header_search_button_aria_full()}
								>
									<SearchIcon size={14} className="text-muted" />
									<span>{m.header_search_button_label()}</span>
									<ShortcutHint
										keys={["\u2318", "K"]}
										className="hidden sm:inline-flex"
									/>
								</button>
							</BottomShadow>
							<IconButton
								type="button"
								variant="subtle"
								size="md"
								onClick={onOpenSearch}
								aria-label={m.header_search_icon_aria()}
								className="inline-flex md:hidden"
							>
								<SearchIcon size={16} className="text-muted" />
							</IconButton>
						</>
					)}
					<button
						type="button"
						onClick={handleOpenChangelog}
						className="relative hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-muted hover:text-secondary hover:bg-surface-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vibrant-cyan/70"
						aria-label={m.header_changelog_button_aria()}
						title={m.header_changelog_button_title()}
					>
						<Sparkles size={12} />
						<span>{m.header_changelog_button_label()}</span>
						{showNewBadge && (
							<span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-vibrant-pink rounded-full animate-pulse" />
						)}
					</button>
					<button
						type="button"
						onClick={() => handleLocaleChange(locale === "en" ? "zh-CN" : "en")}
						className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-[11px] text-muted hover:text-secondary hover:bg-surface-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vibrant-cyan/70"
						aria-label={m.user_menu_language_label()}
					>
						<span>{locale === "en" ? "中文" : "English"}</span>
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
						onClick={toggleTheme}
						aria-label={m.header_theme_toggle_aria()}
						className="hover:text-secondary hover:bg-surface-muted/60"
						title={m.header_theme_toggle_title()}
					>
						{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
					</IconButton>
				</div>
			</div>

			{/* Changelog Dialog */}
			<ChangelogDialog isOpen={changelogOpen} onClose={handleCloseChangelog} />
		</header>
	);
};
