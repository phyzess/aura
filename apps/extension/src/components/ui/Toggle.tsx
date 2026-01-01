import type * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	label?: string;
	size?: "sm" | "md";
}

export const Toggle: React.FC<ToggleProps> = ({
	checked,
	onChange,
	disabled = false,
	label,
	size = "md",
}) => {
	const handleClick = () => {
		if (!disabled) {
			onChange(!checked);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			handleClick();
		}
	};

	const trackSize = size === "sm" ? "w-9 h-5" : "w-11 h-6";
	const thumbSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
	const thumbTranslate = size === "sm" ? "translate-x-4" : "translate-x-5";

	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			disabled={disabled}
			className={cn(
				"relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out",
				"focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
				trackSize,
				checked ? "bg-accent" : "bg-surface-muted",
				disabled && "opacity-50 cursor-not-allowed",
				!disabled && "cursor-pointer",
			)}
		>
			<span
				className={cn(
					"inline-block rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
					thumbSize,
					checked ? thumbTranslate : "translate-x-0.5",
				)}
			/>
		</button>
	);
};

