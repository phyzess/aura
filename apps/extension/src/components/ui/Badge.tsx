import type * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "accent" | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

const variantClassName: Record<BadgeVariant, string> = {
	accent: "bg-accent-soft text-accent",
	neutral: "bg-surface-muted text-secondary",
};

export const Badge: React.FC<BadgeProps> = ({
	variant = "accent",
	className,
	children,
	...props
}) => {
	const baseClasses =
		"inline-flex items-center rounded-full px-2 py-0.5 text-label font-medium whitespace-nowrap";

	const classes = cn(baseClasses, variantClassName[variant], className);

	return (
		<span className={classes} {...props}>
			{children}
		</span>
	);
};
