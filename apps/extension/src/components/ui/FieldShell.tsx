import type * as React from "react";
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
	const fieldClasses: string[] = [
		"relative z-10 flex items-center w-full rounded-xl text-body text-primary placeholder:text-muted transition-colors",
	];

	if (innerClassName) {
		fieldClasses.push(innerClassName);
	}

	if (variant === "default") {
		fieldClasses.push("bg-surface-elevated border-2 border-surface-border");
	} else if (variant === "borderless") {
		fieldClasses.push("bg-transparent border border-transparent");
	}

	if (size === "sm") {
		fieldClasses.push("px-3 py-2 text-sm");
	} else {
		fieldClasses.push("px-3 py-2.5 text-sm");
	}

	if (hasError) {
		fieldClasses.push("border-danger");
	}

	const wrapperClasses = [
		"group bottom-shadow-wrapper bottom-shadow-lg bottom-shadow-focus rounded-xl",
		wrapperClassName,
	]
		.filter(Boolean)
		.join(" ");

	const fieldClassName = fieldClasses.filter(Boolean).join(" ");

	return (
		<div className={containerClassName}>
			<div className={wrapperClasses}>
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
			</div>
		</div>
	);
};

FieldShell.displayName = "FieldShell";
