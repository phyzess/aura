import type * as React from "react";
import type { PopoverAlign, PopoverPosition } from "react-tiny-popover";
import { Popover as TinyPopover } from "react-tiny-popover";
import { cn } from "@/lib/utils";

export interface PopoverProps {
	isOpen: boolean;
	onClickOutside?: () => void;
	children: React.ReactNode;
	content: React.ReactNode;
	positions?: PopoverPosition[];
	align?: PopoverAlign;
	padding?: number;
	containerClassName?: string;
	parentElement?: HTMLElement;
	reposition?: boolean;
}

export const Popover: React.FC<PopoverProps> = ({
	isOpen,
	onClickOutside,
	children,
	content,
	positions = ["bottom"],
	align = "start",
	padding = 8,
	containerClassName,
	parentElement,
	reposition = true,
}) => {
	return (
		<TinyPopover
			isOpen={isOpen}
			positions={positions}
			align={align}
			padding={padding}
			reposition={reposition}
			onClickOutside={onClickOutside}
			containerClassName={cn("z-[200]", containerClassName)}
			parentElement={parentElement ?? document.body}
			content={
				<div className="bg-surface-elevated rounded-2xl shadow-lg border border-surface-border/50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 backdrop-blur-sm">
					{content}
				</div>
			}
		>
			{children}
		</TinyPopover>
	);
};
