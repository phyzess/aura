import * as React from "react";
import { cn } from "@/lib/utils";

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

const variantStyles: Record<ButtonVariant, string> = {
	primary: cn(
		"bg-[var(--color-primary)] text-[var(--color-on-primary)]",
		"hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]",
		"disabled:hover:bg-[var(--color-primary)]",
	),
	secondary: cn(
		"bg-[var(--color-secondary)] text-[var(--color-on-secondary)]",
		"hover:bg-[var(--color-secondary-hover)] active:bg-[var(--color-secondary-active)]",
		"disabled:hover:bg-[var(--color-secondary)]",
	),
	ghost: cn(
		"bg-[var(--color-ghost)] text-[var(--color-on-ghost)]",
		"hover:bg-[var(--color-ghost-hover)] active:bg-[var(--color-ghost-active)]",
		"disabled:hover:bg-[var(--color-ghost)]",
	),
	outline: cn(
		"bg-[var(--color-outline)] text-[var(--color-on-outline)]",
		"border-2 border-[var(--color-outline-border)]",
		"hover:bg-[var(--color-outline-hover)] active:bg-[var(--color-outline-active)]",
		"disabled:hover:bg-[var(--color-outline)]",
	),
	destructive: cn(
		"bg-[var(--color-destructive)] text-[var(--color-on-destructive)]",
		"hover:bg-[var(--color-destructive-hover)] active:bg-[var(--color-destructive-active)]",
		"disabled:hover:bg-[var(--color-destructive)]",
	),
	link: cn(
		"p-0 rounded-md bg-transparent text-[var(--color-accent)]",
		"gap-1 no-underline",
		"hover:underline hover:underline-offset-2",
		"disabled:hover:no-underline",
	),
};

const sizeStyles: Record<ButtonSize, string> = {
	sm: "px-3 py-1.5 text-[var(--font-size-small)] leading-[var(--font-line-height-small)]",
	md: "px-4 py-2.5 text-[var(--font-size-body)] leading-[var(--font-line-height-body)]",
	lg: "px-6 py-3 text-[var(--font-size-base)] leading-[var(--font-line-height-base)]",
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
		return (
			<button
				ref={ref}
				className={cn(
					"inline-flex items-center justify-center gap-2 rounded-lg",
					"font-medium transition-all duration-200",
					"border-none cursor-pointer",
					"focus:outline-none",
					"disabled:opacity-50 disabled:cursor-not-allowed",
					variantStyles[variant],
					!iconOnly && sizeStyles[size],
					iconOnly && "p-0",
					fullWidth && "w-full",
					className,
				)}
				{...props}
			/>
		);
	},
);

Button.displayName = "Button";
