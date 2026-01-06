import type * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
	icon?: React.ReactNode;
	title: React.ReactNode;
	description?: React.ReactNode;
	action?: React.ReactNode;
	suggestions?: string[];
	variant?: "default" | "compact";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
	icon,
	title,
	description,
	action,
	suggestions,
	variant = "default",
	className,
	...props
}) => {
	const baseClasses = cn(
		"inline-flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-dashed border-surface bg-surface-elevated group transition-all duration-200 hover:border-accent/30 hover:bg-surface-elevated/80 mx-auto",
		variant === "default" ? "min-h-[160px]" : "min-h-[120px]",
	);

	const classes = cn(baseClasses, className);

	return (
		<div className={classes} {...props}>
			{icon && (
				<div className="text-2xl mb-2 opacity-50 group-hover:scale-110 group-hover:opacity-70 transition-all duration-300">
					{icon}
				</div>
			)}
			<span className="text-body text-secondary font-medium mb-1">{title}</span>
			{description && (
				<p className="text-sm text-muted mb-3 max-w-xs leading-relaxed">
					{description}
				</p>
			)}
			{suggestions && suggestions.length > 0 && (
				<ul className="text-xs text-muted mb-3 space-y-1 max-w-xs text-left">
					{suggestions.map((suggestion) => (
						<li key={suggestion} className="flex items-start gap-1.5">
							<span className="text-accent mt-0.5">•</span>
							<span>{suggestion}</span>
						</li>
					))}
				</ul>
			)}
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
};
