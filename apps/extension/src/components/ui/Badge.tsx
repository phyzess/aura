import { AnimatePresence, motion } from "motion/react";
import type * as React from "react";
import { useEffect, useState } from "react";
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

	// 检测 children 是否为数字
	const isNumber =
		typeof children === "number" || !Number.isNaN(Number(children));
	const [displayValue, setDisplayValue] = useState(children);

	useEffect(() => {
		if (isNumber && children !== displayValue) {
			setDisplayValue(children);
		}
	}, [children, isNumber, displayValue]);

	if (!isNumber) {
		return (
			<span className={classes} {...props}>
				{children}
			</span>
		);
	}

	return (
		<span className={classes} {...props}>
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.span
					key={displayValue as React.Key}
					initial={{ y: -10, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 10, opacity: 0 }}
					transition={{
						type: "spring",
						stiffness: 500,
						damping: 30,
						mass: 0.5,
					}}
				>
					{displayValue}
				</motion.span>
			</AnimatePresence>
		</span>
	);
};
