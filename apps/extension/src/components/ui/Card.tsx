import type * as React from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "elevated" | "glass";

export type CardPadding = "none" | "sm" | "md" | "lg";

export type CardRadius = "xl" | "2xl" | "3xl" | "4xl";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: CardVariant;
	padding?: CardPadding;
	radius?: CardRadius;
	interactive?: boolean;
	selected?: boolean;
	border?: boolean;
}

const variantClassName: Record<CardVariant, string> = {
	elevated: "bg-surface-elevated",
	glass: "bg-surface-glass backdrop-blur-md",
};

const paddingClassName: Record<CardPadding, string> = {
	none: "",
	sm: "p-3",
	md: "p-4",
	lg: "p-6",
};

const radiusClassName: Record<CardRadius, string> = {
	xl: "rounded-xl",
	"2xl": "rounded-2xl",
	"3xl": "rounded-3xl",
	"4xl": "rounded-4xl",
};

export const Card: React.FC<CardProps> = ({
	variant = "elevated",
	padding = "none",
	radius = "3xl",
	interactive = false,
	selected = false,
	border = true,
	className,
	...props
}) => {
	const baseClasses =
		"flex flex-col shadow-soft overflow-hidden transition-all duration-300";

	const classes = cn(
		baseClasses,
		variantClassName[variant],
		paddingClassName[padding],
		radiusClassName[radius],
		interactive &&
			"cursor-pointer hover:shadow-soft-hover hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft",
		selected && "ring-2 ring-accent-soft ring-offset-0",
		border && "border border-surface",
		className,
	);

	return <div className={classes} {...props} />;
};

export interface CardSectionProps
	extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader: React.FC<CardSectionProps> = ({
	className,
	...props
}) => {
	return (
		<div
			className={cn("flex items-center justify-between gap-3", className)}
			{...props}
		/>
	);
};

export const CardBody: React.FC<CardSectionProps> = ({
	className,
	...props
}) => {
	return <div className={cn("flex-1 flex flex-col", className)} {...props} />;
};

export const CardFooter: React.FC<CardSectionProps> = ({
	className,
	...props
}) => {
	return (
		<div
			className={cn("flex items-center justify-end gap-2", className)}
			{...props}
		/>
	);
};
