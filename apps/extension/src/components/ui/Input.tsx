import * as React from "react";

export type InputSize = "sm" | "md";

export type InputVariant = "default" | "borderless";

export interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	size?: InputSize;
	variant?: InputVariant;
	hasLeftIcon?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			size = "md",
			variant = "default",
			hasLeftIcon = false,
			className,
			...props
		},
		ref,
	) => {
		const baseClass =
			variant === "borderless"
				? "w-full bg-transparent border-0 text-body text-primary placeholder:text-muted focus:outline-none"
				: "w-full rounded-xl bg-surface-elevated border-2 border-surface-border text-body text-primary placeholder:text-muted focus:outline-none";

		const paddingClass =
			variant === "borderless"
				? "px-0 py-0"
				: size === "sm"
					? hasLeftIcon
						? "pl-9 pr-3 py-2"
						: "px-3 py-2"
					: hasLeftIcon
						? "pl-9 pr-3 py-2.5"
						: "px-3 py-2.5";

		const classes = [baseClass, paddingClass, className]
			.filter(Boolean)
			.join(" ");

		return <input ref={ref} className={classes} {...props} />;
	},
);

Input.displayName = "Input";
