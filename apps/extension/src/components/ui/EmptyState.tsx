import type * as React from "react";

export interface EmptyStateProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
	icon?: React.ReactNode;
	title: React.ReactNode;
	description?: React.ReactNode;
	action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
	icon,
	title,
	description,
	action,
	className,
	...props
}) => {
	const baseClasses =
		"h-40 flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-dashed border-surface bg-surface-elevated group transition-colors";

	const classes = [baseClasses, className].filter(Boolean).join(" ");

	return (
		<div className={classes} {...props}>
			{icon && (
				<div className="text-2xl mb-2 opacity-50 group-hover:scale-110 transition-transform duration-300">
					{icon}
				</div>
			)}
			<span className="text-body text-secondary font-medium mb-3">{title}</span>
			{description && (
				<p className="text-sm text-muted mb-3 max-w-xs">{description}</p>
			)}
			{action}
		</div>
	);
};
