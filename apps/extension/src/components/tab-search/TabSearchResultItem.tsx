import { ExternalLink, Folder, Globe, Layout } from "lucide-react";
import type React from "react";
import type { Collection, TabItem, Workspace } from "@/types";

type TabSearchResultVariant = "popup" | "dashboard";

interface TabSearchResultItemProps {
	tab: TabItem;
	workspace?: Workspace | null;
	collection?: Collection | null;
	variant?: TabSearchResultVariant;
	onClick: (tab: TabItem, event: React.MouseEvent<HTMLDivElement>) => void;
}

const vibrantColors = [
	"bg-vibrant-orange",
	"bg-vibrant-pink",
	"bg-vibrant-yellow",
	"bg-vibrant-cyan",
	"bg-vibrant-lime",
];

export const TabSearchResultItem: React.FC<TabSearchResultItemProps> = ({
	tab,
	workspace,
	collection,
	variant = "popup",
	onClick,
}) => {
	let hostname = "";
	try {
		hostname = new URL(tab.url).hostname.replace("www.", "");
	} catch {
		hostname = tab.url;
	}

	const isDashboard = variant === "dashboard";
	const basePadding = isDashboard ? "p-3" : "p-2.5";
	const baseText = isDashboard ? "text-sm" : "text-xs";
	const randomColor =
		vibrantColors[Math.floor(Math.random() * vibrantColors.length)];

	const containerClasses = isDashboard
		? `group relative flex items-center justify-between gap-3 ${basePadding} bg-surface-elevated rounded-xl border-2 border-surface-border hover:border-black dark:hover:border-white hover:shadow-soft-hover cursor-pointer transition-all duration-200 overflow-hidden`
		: `group flex items-center justify-between gap-3 ${basePadding} rounded-xl border border-surface bg-transparent hover:bg-surface-elevated hover:border-surface-border hover:shadow-soft-hover cursor-pointer transition-all duration-200`;

	const iconClasses = isDashboard
		? "w-8 h-8 rounded-lg bg-surface-elevated border border-surface flex items-center justify-center shrink-0 overflow-hidden text-muted"
		: "w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center shrink-0 overflow-hidden text-primary group-hover:bg-surface-elevated group-hover:scale-105 transition-all duration-200";

	return (
		<div onClick={(event) => onClick(tab, event)} className={containerClasses}>
			{isDashboard && (
				<div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
					<div
						className={`absolute top-0 right-0 w-20 h-20 ${randomColor} rounded-full blur-2xl`}
					/>
				</div>
			)}
			<div className="flex items-center gap-3 relative z-10 min-w-0 flex-1">
				<div className={iconClasses}>
					{tab.faviconUrl ? (
						<img src={tab.faviconUrl} alt="" className="w-4 h-4 rounded-sm" />
					) : (
						<Globe size={14} />
					)}
				</div>
				<div className="min-w-0 flex-1">
					<div
						className={`${baseText} font-semibold text-primary truncate transition-colors`}
					>
						{tab.title}
					</div>
					<div className="text-label text-muted truncate opacity-80 mt-0.5">
						{hostname}
					</div>
					<div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
						{workspace && (
							<div className="flex items-center gap-1 bg-surface-muted px-1.5 py-0.5 rounded text-[9px] font-bold text-secondary shrink-0 max-w-25">
								<Layout size={8} />
								<span className="truncate">{workspace.name}</span>
							</div>
						)}
						{collection && (
							<div className="flex items-center gap-1 bg-surface-muted px-1.5 py-0.5 rounded text-[9px] font-bold text-secondary shrink-0 max-w-25">
								<Folder size={8} />
								<span className="truncate">{collection.name}</span>
							</div>
						)}
					</div>
				</div>
				<div className="w-7 h-7 rounded-full bg-surface-muted flex items-center justify-center text-muted group-hover:bg-surface-elevated group-hover:text-primary transition-colors duration-200">
					<ExternalLink size={12} />
				</div>
			</div>
		</div>
	);
};
