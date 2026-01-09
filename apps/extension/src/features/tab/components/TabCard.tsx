import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSetAtom } from "jotai";
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	ExternalLink,
	Globe,
	HelpCircle,
	Loader2,
	Pin,
	X,
} from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { EASINGS, TRANSITIONS } from "@/config/animations";
import { toggleTabPinAtom } from "@/features";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import type { TabItem } from "@/types";
import { formatLastVisited, getTimeAge } from "@/utils/timeUtils";

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

const getLinkStatusInfo = (status?: string) => {
	switch (status) {
		case "valid":
			return {
				icon: CheckCircle2,
				color: "text-green-500",
				label: m.tab_link_status_valid(),
				show: false, // Don't show valid status by default
			};
		case "broken":
			return {
				icon: AlertTriangle,
				color: "text-red-500",
				label: m.tab_link_status_broken(),
				show: true,
			};
		case "uncertain":
			return {
				icon: HelpCircle,
				color: "text-yellow-500",
				label: m.tab_link_status_uncertain(),
				show: true,
			};
		case "checking":
			return {
				icon: Loader2,
				color: "text-blue-500",
				label: m.tab_link_status_checking(),
				show: true,
			};
		default:
			return null;
	}
};

interface TabCardProps {
	tab: TabItem;
	onDelete: (id: string) => void;
	isHighlighted?: boolean;
	isDragOverlay?: boolean;
}

export const TabCard: React.FC<TabCardProps> = ({
	tab,
	onDelete,
	isHighlighted,
	isDragOverlay = false,
}) => {
	const togglePin = useSetAtom(toggleTabPinAtom);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: tab.id,
		data: {
			type: "TAB",
			tabId: tab.id,
			collectionId: tab.collectionId,
		},
	});

	const hostname = new URL(tab.url).hostname.replace("www.", "");
	const stripColor = getHostnameColor(hostname);
	const timeAge = getTimeAge(tab.updatedAt);
	const linkStatus = getLinkStatusInfo(tab.linkStatus);

	// Calculate opacity based on age and link status
	const getOpacity = () => {
		if (isDragging) return 0.5;
		if (tab.linkStatus === "broken") return 0.6;
		if (timeAge.level === "old") return 0.85;
		if (timeAge.level === "ancient") return 0.7;
		return 1;
	};

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: getOpacity(),
	};

	return (
		<motion.div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			id={`tab-${tab.id}`}
			layout
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: getOpacity(), y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			whileHover={!isDragging ? { y: -2, scale: 1.005 } : undefined}
			whileTap={!isDragging ? { scale: 0.995 } : undefined}
			transition={{
				layout: { duration: 0.3, ease: EASINGS.smooth },
				default: TRANSITIONS.fast,
			}}
			className={cn(
				"group relative flex items-center gap-3 bg-surface-muted px-3 py-2.5 rounded-xl overflow-hidden border shadow-none cursor-grab active:cursor-grabbing",
				isHighlighted && "ring-2 ring-accent-soft ring-offset-0",
				isDragging && "z-50 ring-2 ring-accent/50 shadow-xl rotate-2",
				tab.linkStatus === "broken" && "border-red-500/50",
				tab.linkStatus === "uncertain" && "border-yellow-500/30",
				(!tab.linkStatus ||
					tab.linkStatus === "unchecked" ||
					tab.linkStatus === "valid") &&
					"border-transparent",
			)}
			title={formatLastVisited(tab.updatedAt)}
		>
			{isDragging && (
				<div className="absolute inset-0 bg-linear-to-br from-accent/20 via-transparent to-accent/10 pointer-events-none" />
			)}
			<motion.div
				style={{ backgroundColor: stripColor }}
				initial={{ scaleX: 0 }}
				animate={{ scaleX: isHighlighted ? 1 : 0 }}
				whileHover={{ scaleX: 1.1 }}
				transition={{
					duration: 0.25,
					ease: EASINGS.bounce,
				}}
				className="pointer-events-none absolute inset-y-0 left-0 w-1.5 origin-left shadow-glow"
			/>
			{!isDragOverlay && (
				<button
					type="button"
					className={cn(
						"absolute top-1.5 left-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-surface-elevated shadow-soft-hover transition-all",
						tab.isPinned
							? "text-accent opacity-100"
							: "text-muted opacity-0 group-hover:opacity-100",
					)}
					onClick={(e) => {
						e.stopPropagation();
						togglePin(tab.id);
					}}
					aria-pressed={!!tab.isPinned}
					title={tab.isPinned ? m.tab_unpin_title() : m.tab_pin_title()}
					aria-label={tab.isPinned ? m.tab_unpin_title() : m.tab_pin_title()}
				>
					<Pin size={11} className="fill-current rotate-315" />
				</button>
			)}
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
					<div className="mt-1 max-w-full overflow-hidden flex items-center gap-1.5">
						<Badge
							variant="neutral"
							className="px-2 py-0.5 text-[11px] max-w-full truncate"
						>
							{hostname}
						</Badge>
						{linkStatus?.show && (
							<Badge
								variant={
									tab.linkStatus === "broken"
										? "danger"
										: tab.linkStatus === "uncertain"
											? "warning"
											: "neutral"
								}
								className="px-2 py-0.5 text-[11px] flex items-center gap-1"
							>
								<linkStatus.icon
									size={10}
									className={cn(
										linkStatus.color,
										tab.linkStatus === "checking" && "animate-spin",
									)}
								/>
								<span>{linkStatus.label}</span>
							</Badge>
						)}
						{timeAge.level !== "fresh" && (
							<Badge
								variant={
									timeAge.level === "ancient"
										? "danger"
										: timeAge.level === "old"
											? "warning"
											: timeAge.level === "stale"
												? "warning"
												: "neutral"
								}
								className="px-2 py-0.5 text-[11px] flex items-center gap-1"
							>
								<Clock size={10} />
								<span>{timeAge.label}</span>
							</Badge>
						)}
					</div>
				</div>
			</div>

			{!isDragOverlay && (
				<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
					<div
						className={cn(
							"flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface shadow-soft-hover text-muted opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-160 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-auto",
						)}
					>
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
			)}
		</motion.div>
	);
};
