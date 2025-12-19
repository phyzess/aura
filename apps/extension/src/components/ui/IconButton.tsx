import type * as React from "react";

export type IconButtonSize = "sm" | "md";

export type IconButtonVariant = "neutral" | "subtle" | "accent" | "danger";

export interface IconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	size?: IconButtonSize;
	variant?: IconButtonVariant;
	active?: boolean;
}

const sizeClassName: Record<IconButtonSize, string> = {
	sm: "w-6 h-6 text-[11px]",
	md: "w-8 h-8 text-xs",
};

const variantClassName: Record<IconButtonVariant, string> = {
	neutral:
		"text-secondary hover:text-accent hover:bg-surface-muted border border-transparent",
	subtle:
		"text-muted hover:text-accent hover:bg-surface-muted border border-transparent",
	accent:
		"bg-accent-soft text-accent hover:bg-accent hover:text-on-accent border border-transparent",
	danger:
		"text-current hover:bg-danger-soft hover:text-danger border border-transparent",
};

export const IconButton: React.FC<IconButtonProps> = ({
	size = "md",
	variant = "neutral",
	active,
	className,
	...props
}) => {
	const baseClasses =
		"inline-flex items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-cyan/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

	const activeClasses = active ? " text-accent bg-surface-muted" : "";

	const classes = [
		baseClasses,
		sizeClassName[size],
		variantClassName[variant],
		activeClasses,
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <button className={classes} {...props} />;
};
