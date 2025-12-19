import { ChevronRight } from "lucide-react";
import type React from "react";

interface PopupListItemProps {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	onClick: () => void;
}

export const PopupListItem: React.FC<PopupListItemProps> = ({
	icon,
	title,
	subtitle,
	onClick,
}) => {
	const vibrantColors = [
		"bg-vibrant-orange",
		"bg-vibrant-pink",
		"bg-vibrant-yellow",
		"bg-vibrant-cyan",
		"bg-vibrant-lime",
	];
	const randomColor =
		vibrantColors[Math.floor(Math.random() * vibrantColors.length)];

	return (
		<div
			onClick={onClick}
			className="group p-2.5 bg-surface-elevated rounded-xl border-2 border-surface-border hover:border-black dark:hover:border-white hover:shadow-soft-hover cursor-pointer transition-all duration-200 flex justify-between items-center relative overflow-hidden"
		>
			<div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
				<div
					className={`absolute top-0 right-0 w-20 h-20 ${randomColor} rounded-full blur-2xl`}
				/>
			</div>
			<div className="flex items-center gap-3 relative z-10 min-w-0">
				<div className="w-9 h-9 rounded-xl bg-surface-muted flex items-center justify-center shrink-0 text-primary group-hover:bg-surface-elevated group-hover:text-primary group-hover:scale-105 transition-all duration-200">
					{icon}
				</div>
				<div className="min-w-0">
					<div className="font-bold text-primary text-body truncate transition-colors">
						{title}
					</div>
					<div className="text-label text-muted flex items-center gap-1 truncate mt-0.5">
						{subtitle}
					</div>
				</div>
			</div>
			<div className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-muted group-hover:bg-surface-elevated group-hover:text-primary transition-colors">
				<ChevronRight size={18} />
			</div>
		</div>
	);
};
