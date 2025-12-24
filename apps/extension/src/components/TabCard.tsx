import { ExternalLink, Globe, Pin, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import type { TabItem } from "@/types";

const TAB_STRIP_COLORS = [
	"hsl(265, 100%, 70%)", // neon violet
	"hsl(215, 100%, 68%)", // neon blue
	"hsl(190, 100%, 62%)", // aqua
	"hsl(155, 95%, 60%)", // mint green
	"hsl(45, 100%, 64%)", // bright yellow-orange
	"hsl(330, 100%, 70%)", // hot pink
];

const getHostnameColor = (hostname: string) => {
	let hash = 0;
	for (let i = 0; i < hostname.length; i += 1) {
		hash = (hash * 31 + hostname.charCodeAt(i)) >>> 0;
	}
	return TAB_STRIP_COLORS[hash % TAB_STRIP_COLORS.length];
};

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
	const hostname = new URL(tab.url).hostname.replace("www.", "");
	const stripColor = getHostnameColor(hostname);

	return (
		<div
			id={`tab-${tab.id}`}
			className={cn(
				"group relative flex items-center gap-3 bg-surface-muted px-3 py-2.5 rounded-xl overflow-hidden border border-transparent shadow-none cursor-grab active:cursor-grabbing transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-surface-elevated hover:shadow-soft-hover hover:-translate-y-0.5",
				isHighlighted && "ring-2 ring-accent-soft ring-offset-0 scale-[1.01]",
			)}
			draggable
			onDragStart={(e) => {
				e.dataTransfer.setData(
					"text/plain",
					JSON.stringify({ type: "TAB", id: tab.id }),
				);
			}}
		>
			<div
				style={{ backgroundColor: stripColor }}
				className={cn(
					"pointer-events-none absolute inset-y-0 left-0 w-1.5 transform origin-left transition-transform duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
					isHighlighted
						? "scale-x-100 shadow-glow"
						: "scale-x-0 group-hover:scale-x-110",
				)}
			/>
			<div className="flex items-center gap-3 overflow-hidden flex-1">
				<div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-surface flex items-center justify-center shrink-0 text-primary">
					{tab.faviconUrl ? (
						<img src={tab.faviconUrl} alt="" className="w-4 h-4 rounded-sm" />
					) : (
						<Globe size={16} />
					)}
				</div>

				<div className="flex flex-col overflow-hidden">
					<span className="text-body md:text-[15px] font-semibold text-primary truncate leading-tight">
						{tab.title}
					</span>
					<div className="mt-1 max-w-full overflow-hidden">
						<Badge
							variant="neutral"
							className="px-2 py-0.5 text-[11px] max-w-full truncate"
						>
							{hostname}
						</Badge>
					</div>
				</div>
			</div>

			<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
				<div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface shadow-soft-hover text-muted opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-160 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-auto">
					{tab.isPinned && <Pin size={12} className="text-accent mr-0.5" />}
					<IconButton
						type="button"
						onClick={() => window.open(tab.url, "_blank")}
						variant="subtle"
						size="sm"
						title={m.tab_card_open_link_title()}
						aria-label={m.tab_card_open_link_title()}
						className="text-primary"
					>
						<ExternalLink size={15} />
					</IconButton>
					<IconButton
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDelete(tab.id);
						}}
						variant="danger"
						size="sm"
						className="text-destructive"
						title={m.tab_card_delete_tab_title()}
						aria-label={m.tab_card_delete_tab_title()}
					>
						<X size={15} />
					</IconButton>
				</div>
			</div>
		</div>
	);
};
