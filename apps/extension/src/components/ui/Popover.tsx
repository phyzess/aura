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
}) => {
	return (
		<TinyPopover
			isOpen={isOpen}
			positions={positions}
			align={align}
			padding={padding}
			onClickOutside={onClickOutside}
			containerClassName={cn("z-200", containerClassName)}
			parentElement={parentElement || document.body}
			content={
				<div className="bg-surface-elevated rounded-2xl shadow-soft border border-surface-border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
					{content}
				</div>
			}
		>
			{children}
		</TinyPopover>
	);
};
