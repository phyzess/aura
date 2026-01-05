import type * as React from "react";
import { cn } from "@/lib/utils";

export type DividerOrientation = "horizontal" | "vertical";

export type DividerTone = "subtle" | "default" | "strong";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
	orientation?: DividerOrientation;
	tone?: DividerTone;
	label?: React.ReactNode;
	labelClassName?: string;
}

export const Divider: React.FC<DividerProps> = ({
	orientation = "horizontal",
	tone = "default",
	label,
	children,
	className,
	labelClassName,
	...props
}) => {
	const content = label ?? children;

	let lineClass = "border-surface border-opacity-60";
	let wrapperToneClass = "text-secondary";
	let labelToneClass = "text-secondary";

	if (tone === "subtle") {
		lineClass = "border-surface border-opacity-30";
		wrapperToneClass = "text-muted";
		labelToneClass = "text-muted";
	} else if (tone === "strong") {
		lineClass = "border-surface-strong border-opacity-80";
		wrapperToneClass = "text-secondary";
		labelToneClass = "text-secondary";
	}

	if (orientation === "vertical") {
		return (
			<div
				className={cn("mx-2 h-full border-l", lineClass, className)}
				{...props}
			/>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center gap-3 text-[11px]",
				wrapperToneClass,
				className,
			)}
			{...props}
		>
			<div className={cn("flex-1 border-t", lineClass)} />
			{content ? (
				<span
					className={cn(
						"text-[11px] font-normal tracking-wide",
						labelToneClass,
						labelClassName,
					)}
				>
					{content}
				</span>
			) : null}
			<div className={cn("flex-1 border-t", lineClass)} />
		</div>
	);
};
