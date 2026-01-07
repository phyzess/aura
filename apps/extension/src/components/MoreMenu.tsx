import {
	Github,
	Globe,
	HelpCircle,
	MoreVertical,
	Sparkles,
} from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Menu } from "@/components/ui/Menu";
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
	return (
		<Menu>
			<IconButton
				type="button"
				variant="subtle"
				size="sm"
				aria-label="More options"
				className="hover:text-secondary hover:bg-surface-muted/60 relative"
			>
				<MoreVertical size={18} />
				{showNewBadge && (
					<span className="absolute top-0 right-0 w-2 h-2 bg-vibrant-pink rounded-full animate-pulse" />
				)}
			</IconButton>

			<Menu.Content>
				<Menu.Item
					icon={<Globe size={14} />}
					onClick={() => onLocaleChange(locale === "en" ? "zh-CN" : "en")}
				>
					{locale === "en" ? "中文" : "English"}
				</Menu.Item>

				{onOpenShortcuts && (
					<Menu.Item icon={<HelpCircle size={14} />} onClick={onOpenShortcuts}>
						Keyboard shortcuts
					</Menu.Item>
				)}

				<Menu.Item
					icon={<Sparkles size={14} />}
					onClick={onOpenChangelog}
					className="relative"
				>
					<span>{m.header_changelog_button_label()}</span>
					{showNewBadge && (
						<span className="ml-auto w-2 h-2 bg-vibrant-pink rounded-full animate-pulse" />
					)}
				</Menu.Item>

				<Menu.Separator />

				<Menu.Item
					icon={<Github size={14} />}
					onClick={() => window.open(GITHUB_REPO_URL, "_blank")}
				>
					{m.header_github_link_title()}
				</Menu.Item>
			</Menu.Content>
		</Menu>
	);
};
