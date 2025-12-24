import type * as React from "react";
import { cn } from "@/lib/utils";
import { BottomShadow } from "./BottomShadow";
import type { InputSize, InputVariant } from "./Input";

export interface FieldShellProps {
	size?: InputSize;
	variant?: InputVariant;
	prefix?: React.ReactNode;
	suffix?: React.ReactNode;
	hasError?: boolean;
	containerClassName?: string;
	wrapperClassName?: string;
	innerClassName?: string;
	children: React.ReactNode;
}

export const FieldShell: React.FC<FieldShellProps> = ({
	size = "md",
	variant = "default",
	prefix,
	suffix,
	hasError,
	containerClassName,
	wrapperClassName,
	innerClassName,
	children,
}) => {
	const fieldClassName = cn(
		"relative z-10 flex items-center w-full rounded-xl text-body text-primary placeholder:text-muted transition-colors",
		innerClassName,
		variant === "default" &&
			"bg-surface-elevated border-2 border-surface-border",
		variant === "borderless" && "bg-transparent border border-transparent",
		size === "sm" ? "px-3 py-2 text-sm" : "px-3 py-2.5 text-sm",
		hasError && "border-danger",
	);

	return (
		<div className={containerClassName}>
			<BottomShadow
				size="lg"
				focusWithin
				className={cn("rounded-xl", wrapperClassName)}
			>
				<div className={fieldClassName}>
					{prefix && (
						<div className="mr-2 flex items-center text-muted group-focus-within:text-accent transition-colors">
							{prefix}
						</div>
					)}

					<div className="flex-1 min-w-0">{children}</div>

					{suffix && (
						<div className="ml-2 flex items-center text-muted">{suffix}</div>
					)}
				</div>
			</BottomShadow>
		</div>
	);
};

FieldShell.displayName = "FieldShell";
