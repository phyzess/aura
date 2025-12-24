import type * as React from "react";
import { cn } from "@/lib/utils";

export type BottomShadowSize = "sm" | "md" | "lg";

export interface BottomShadowProps
	extends React.HTMLAttributes<HTMLDivElement> {
	size?: BottomShadowSize;
	hover?: boolean;
	focusWithin?: boolean;
}

const sizeClassName: Record<BottomShadowSize, string> = {
	sm: "bottom-shadow-sm",
	md: "bottom-shadow-md",
	lg: "bottom-shadow-lg",
};

export const BottomShadow: React.FC<BottomShadowProps> = ({
	size = "md",
	hover = false,
	focusWithin = false,
	className,
	children,
	...props
}) => {
	const classes = cn(
		"group bottom-shadow-wrapper",
		sizeClassName[size],
		hover && "bottom-shadow-hover",
		focusWithin && "bottom-shadow-focus",
		className,
	);

	return (
		<div className={classes} {...props}>
			{children}
		</div>
	);
};
