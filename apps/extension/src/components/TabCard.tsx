import { ExternalLink, Globe, Pin, X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import * as m from "@/paraglide/messages";
import type { TabItem } from "@/types";

interface TabCardProps {
	tab: TabItem;
	onDelete: (id: string) => void;
	isHighlighted?: boolean;
}

export const TabCard: React.FC<TabCardProps> = ({
	tab,
	onDelete,
	isHighlighted,
}) => {
	return (
		<div
			id={`tab-${tab.id}`}
			className={`group relative bg-surface-elevated p-2.5 md:p-3 rounded-xl shadow-soft border-2 border-surface-border hover:border-black dark:hover:border-white hover:shadow-soft-hover transition-all duration-300 ease-out flex items-center justify-between gap-2.5 cursor-grab active:cursor-grabbing transform hover:-translate-y-0.5 ${
				isHighlighted ? "ring-2 ring-primary/40 scale-[1.02]" : ""
			}`}
			draggable
			onDragStart={(e) => {
				e.dataTransfer.setData(
					"text/plain",
					JSON.stringify({ type: "TAB", id: tab.id }),
				);
			}}
		>
			<div className="flex items-center gap-3 overflow-hidden relative z-10">
				<div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl border-2 border-surface-border bg-surface-elevated flex items-center justify-center flex-shrink-0 transition-all text-primary dark:text-primary">
					{tab.faviconUrl ? (
						<img src={tab.faviconUrl} alt="" className="w-5 h-5 rounded-sm" />
					) : (
						<Globe size={18} />
					)}
				</div>

				<div className="flex flex-col overflow-hidden">
					<span className="text-body md:text-[15px] font-semibold text-primary truncate leading-tight transition-colors">
						{tab.title}
					</span>
					<span className="text-[11px] font-medium text-muted truncate mt-0.5 group-hover:text-secondary">
						{new URL(tab.url).hostname.replace("www.", "")}
					</span>
				</div>
			</div>

			<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-surface-elevated backdrop-blur-sm p-1 rounded-full shadow-soft opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-20">
				{tab.isPinned && <Pin size={12} className="text-primary mx-1" />}
				<IconButton
					type="button"
					onClick={() => window.open(tab.url, "_blank")}
					variant="subtle"
					size="sm"
					title={m.tab_card_open_link_title()}
					aria-label={m.tab_card_open_link_title()}
					className="w-6 h-6 md:w-7 md:h-7 text-muted hover:bg-surface-muted hover:text-primary"
				>
					<ExternalLink size={14} />
				</IconButton>
				<IconButton
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onDelete(tab.id);
					}}
					variant="danger"
					size="sm"
					title={m.tab_card_delete_tab_title()}
					aria-label={m.tab_card_delete_tab_title()}
					className="w-6 h-6 md:w-7 md:h-7 text-muted hover:bg-danger-soft hover:text-danger"
				>
					<X size={14} />
				</IconButton>
			</div>
		</div>
	);
};
