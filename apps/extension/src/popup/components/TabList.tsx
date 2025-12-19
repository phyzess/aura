import { ExternalLink, Globe } from "lucide-react";
import type React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChromeService } from "../../services/chrome";
import type { TabItem } from "../../types";

interface TabListProps {
	tabs: TabItem[];
}

export const TabList: React.FC<TabListProps> = ({ tabs }) => {
	if (tabs.length === 0) {
		return <EmptyState title="No tabs in this collection" />;
	}
	return (
		<div className="space-y-1 animate-in slide-in-from-right-4 duration-300">
			{tabs.map((tab) => {
				let hostname = "";
				try {
					hostname = new URL(tab.url).hostname.replace("www.", "");
				} catch {
					hostname = tab.url;
				}

				return (
					<div
						key={tab.id}
						onClick={() => ChromeService.openTab(tab.url)}
						className="group flex items-center justify-between gap-3 p-2.5 rounded-xl border border-surface bg-transparent hover:bg-surface-elevated hover:border-surface-border hover:shadow-soft-hover cursor-pointer transition-all duration-200"
					>
						<div className="flex items-center gap-3 relative z-10 min-w-0 flex-1">
							<div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center shrink-0 overflow-hidden text-primary group-hover:bg-surface-elevated group-hover:scale-105 transition-all duration-200">
								{tab.faviconUrl ? (
									<img
										src={tab.faviconUrl}
										alt=""
										className="w-4 h-4 rounded-sm"
									/>
								) : (
									<Globe size={14} />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-xs font-semibold text-primary truncate transition-colors">
									{tab.title}
								</div>
								<div className="text-label text-muted truncate opacity-80 mt-0.5">
									{hostname}
								</div>
							</div>
						</div>
						<div className="w-7 h-7 rounded-full flex items-center justify-center text-muted group-hover:bg-surface-elevated group-hover:text-primary transition-colors duration-200">
							<ExternalLink size={12} />
						</div>
					</div>
				);
			})}
		</div>
	);
};
