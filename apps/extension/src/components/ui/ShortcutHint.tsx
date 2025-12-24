import type * as React from "react";
import { cn } from "@/lib/utils";

export interface ShortcutHintProps
	extends React.HTMLAttributes<HTMLSpanElement> {
	keys: React.ReactNode[];
}

export const ShortcutHint: React.FC<ShortcutHintProps> = ({
	keys,
	className,
	...props
}) => {
	const baseClasses =
		"inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-label text-muted";

	const classes = cn(baseClasses, className);

	return (
		<span className={classes} {...props}>
			{keys.map((key, index) => (
				<span
					key={`${String(key)}-${index}`}
					className="text-[9px] rounded bg-surface-elevated px-1.5 py-0.5"
				>
					{key}
				</span>
			))}
		</span>
	);
};
