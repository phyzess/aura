import type * as React from "react";

export interface SectionHeaderProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
	title?: React.ReactNode;
	action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
	title,
	action,
	children,
	className,
	...props
}) => {
	const baseClasses = "flex items-center justify-between mb-4 px-1";

	const content = title ?? children;

	return (
		<div
			className={[baseClasses, className].filter(Boolean).join(" ")}
			{...props}
		>
			{typeof content === "string" ? (
				<span className="text-xs font-bold text-muted uppercase tracking-wider">
					{content}
				</span>
			) : (
				content
			)}
			{action ? <div className="flex items-center gap-1">{action}</div> : null}
		</div>
	);
};
