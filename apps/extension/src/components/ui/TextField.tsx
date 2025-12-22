import * as React from "react";
import { FieldShell } from "./FieldShell";
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

				<FieldShell
					size={size}
					variant={variant}
					prefix={prefix}
					suffix={suffix}
					hasError={!!error}
					wrapperClassName={wrapperClassName}
				>
					<Input
						ref={ref}
						id={inputId}
						aria-invalid={error ? true : undefined}
						aria-describedby={describedBy}
						{...inputProps}
						className={inputClasses}
					/>
				</FieldShell>

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
