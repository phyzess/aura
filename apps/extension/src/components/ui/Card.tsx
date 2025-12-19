import type * as React from "react";

export type CardVariant = "elevated" | "glass";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: CardVariant;
}

const variantClassName: Record<CardVariant, string> = {
	elevated: "bg-surface-elevated",
	glass: "bg-surface-glass backdrop-blur-md",
};

export const Card: React.FC<CardProps> = ({
	variant = "elevated",
	className,
	...props
}) => {
	const baseClasses =
		"flex flex-col rounded-3xl border border-surface shadow-soft overflow-hidden transition-colors duration-300";

	const classes = [baseClasses, variantClassName[variant], className]
		.filter(Boolean)
		.join(" ");

	return <div className={classes} {...props} />;
};
