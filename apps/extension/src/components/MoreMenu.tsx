import {
	Github,
	Globe,
	HelpCircle,
	MoreVertical,
	Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { GITHUB_REPO_URL } from "@/config/constants";
import * as m from "@/paraglide/messages";
import type { Locale } from "@/types/paraglide";

interface MoreMenuProps {
	locale: Locale;
	onLocaleChange: (locale: Locale) => void;
	onOpenChangelog: () => void;
	onOpenShortcuts?: () => void;
	showNewBadge?: boolean;
}

export const MoreMenu: React.FC<MoreMenuProps> = ({
	locale,
	onLocaleChange,
	onOpenChangelog,
	onOpenShortcuts,
	showNewBadge,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const handleToggle = () => {
		setIsOpen(!isOpen);
	};

	const handleClose = () => {
		setIsOpen(false);
	};

	const handleLocaleChange = () => {
		onLocaleChange(locale === "en" ? "zh-CN" : "en");
		handleClose();
	};

	const handleChangelog = () => {
		onOpenChangelog();
		handleClose();
	};

	const handleShortcuts = () => {
		onOpenShortcuts?.();
		handleClose();
	};

	const handleGithub = () => {
		window.open(GITHUB_REPO_URL, "_blank");
		handleClose();
	};

	// Close menu when clicking outside
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div className="relative" ref={menuRef}>
			<IconButton
				type="button"
				variant="subtle"
				size="sm"
				onClick={handleToggle}
				aria-label="More options"
				className="hover:text-secondary hover:bg-surface-muted/60 relative"
			>
				<MoreVertical size={18} />
				{showNewBadge && (
					<span className="absolute top-0 right-0 w-2 h-2 bg-vibrant-pink rounded-full animate-pulse" />
				)}
			</IconButton>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-48 bg-surface-elevated border border-surface-border rounded-lg shadow-lg overflow-hidden z-50">
					<div className="py-1">
						{/* 1. Language */}
						<button
							type="button"
							onClick={handleLocaleChange}
							className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-surface-muted/60 transition-colors flex items-center gap-2"
						>
							<Globe size={14} className="text-muted" />
							<span>{locale === "en" ? "中文" : "English"}</span>
						</button>

						{/* 2. Help / Shortcuts */}
						{onOpenShortcuts && (
							<button
								type="button"
								onClick={handleShortcuts}
								className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-surface-muted/60 transition-colors flex items-center gap-2"
							>
								<HelpCircle size={14} className="text-muted" />
								<span>Keyboard shortcuts</span>
							</button>
						)}

						{/* 3. What's New */}
						<button
							type="button"
							onClick={handleChangelog}
							className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-surface-muted/60 transition-colors flex items-center gap-2 relative"
						>
							<Sparkles size={14} className="text-muted" />
							<span>{m.header_changelog_button_label()}</span>
							{showNewBadge && (
								<span className="ml-auto w-2 h-2 bg-vibrant-pink rounded-full animate-pulse" />
							)}
						</button>

						<div className="my-1 border-t border-surface-border" />

						{/* 4. GitHub */}
						<button
							type="button"
							onClick={handleGithub}
							className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-surface-muted/60 transition-colors flex items-center gap-2"
						>
							<Github size={14} className="text-muted" />
							<span>{m.header_github_link_title()}</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
