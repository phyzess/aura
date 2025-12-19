import * as React from "react";

export type ButtonVariant =
	| "primary"
	| "secondary"
	| "ghost"
	| "outline"
	| "destructive"
	| "link";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
	iconOnly?: boolean;
}

const variantClassName: Record<ButtonVariant, string> = {
	primary: "btn-primary",
	secondary: "btn-secondary",
	ghost: "btn-ghost",
	outline: "btn-outline",
	destructive: "btn-destructive",
	link: "btn-link",
};

const sizeClassName: Record<ButtonSize, string> = {
	sm: "btn-sm",
	md: "",
	lg: "btn-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			variant = "primary",
			size = "md",
			fullWidth,
			iconOnly,
			className,
			...props
		},
		ref,
	) => {
		const classes = [
			"btn",
			variantClassName[variant],
			sizeClassName[size],
			fullWidth && "btn-full",
			iconOnly && "btn-icon",
			className,
		]
			.filter(Boolean)
			.join(" ");

		return <button ref={ref} className={classes} {...props} />;
	},
);

Button.displayName = "Button";
