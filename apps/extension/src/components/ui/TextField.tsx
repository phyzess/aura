import * as React from "react";
import {
	Input,
	type InputProps,
	type InputSize,
	type InputVariant,
} from "./Input";

export interface TextFieldProps
	extends Omit<InputProps, "className" | "size" | "prefix"> {
	size?: InputSize;
	variant?: InputVariant;
	label?: React.ReactNode;
	labelClassName?: string;
	containerClassName?: string;
	wrapperClassName?: string;
	inputClassName?: string;
	prefix?: React.ReactNode;
	suffix?: React.ReactNode;
	error?: React.ReactNode;
	helperText?: React.ReactNode;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
	(
		{
			label,
			labelClassName,
			containerClassName,
			wrapperClassName,
			inputClassName,
			prefix,
			suffix,
			error,
			helperText,
			size = "md",
			variant = "default",
			id,
			...inputProps
		},
		ref,
	) => {
		const autoId = React.useId();
		const inputId = id ?? autoId;
		const errorId = error ? `${inputId}-error` : undefined;
		const helperId = !error && helperText ? `${inputId}-helper` : undefined;
		const describedBy = error ? errorId : helperId;

		const fieldClasses: string[] = [
			"relative z-10 flex items-center w-full rounded-xl text-body text-primary placeholder:text-muted transition-colors",
		];

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

		if (error) {
			fieldClasses.push("border-danger");
		}

		const fieldClassName = fieldClasses.filter(Boolean).join(" ");

		const wrapperClasses = [
			"group bottom-shadow-wrapper bottom-shadow-lg bottom-shadow-focus rounded-xl",
			wrapperClassName,
		]
			.filter(Boolean)
			.join(" ");

		const labelClasses = [
			"block text-[11px] font-semibold text-secondary mb-1 ml-0.5",
			labelClassName,
		]
			.filter(Boolean)
			.join(" ");

		const inputClasses = [
			"flex-1 bg-transparent border-0 outline-none focus:outline-none min-w-0",
			inputClassName,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<div className={containerClassName}>
				{label && (
					<label htmlFor={inputId} className={labelClasses}>
						{label}
					</label>
				)}

				<div className={wrapperClasses}>
					<div className={fieldClassName}>
						{prefix && (
							<div className="mr-2 flex items-center text-muted group-focus-within:text-accent transition-colors">
								{prefix}
							</div>
						)}

						<Input
							ref={ref}
							id={inputId}
							aria-invalid={error ? true : undefined}
							aria-describedby={describedBy}
							{...inputProps}
							className={inputClasses}
						/>

						{suffix && (
							<div className="ml-2 flex items-center text-muted">{suffix}</div>
						)}
					</div>
				</div>

				{error && (
					<div id={errorId} className="mt-1 text-xs text-danger ml-0.5">
						{error}
					</div>
				)}

				{!error && helperText && (
					<div id={helperId} className="mt-1 text-xs text-secondary ml-0.5">
						{helperText}
					</div>
				)}
			</div>
		);
	},
);

TextField.displayName = "TextField";
