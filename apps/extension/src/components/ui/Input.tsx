import * as React from "react";

export type InputSize = "sm" | "md";

export type InputVariant = "default" | "borderless";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, ...props }, ref) => {
		const baseClass =
			"w-full bg-transparent text-body text-primary placeholder:text-muted focus:outline-none";

		const classes = [baseClass, className].filter(Boolean).join(" ");

		return <input ref={ref} className={classes} {...props} />;
	},
);

Input.displayName = "Input";
