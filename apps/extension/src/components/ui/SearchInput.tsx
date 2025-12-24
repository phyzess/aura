import { Search, X } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";
import { IconButton } from "./IconButton";
import { Input } from "./Input";

interface SearchInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"value" | "onChange"
	> {
	value: string;
	onChange: (value: string) => void;
	onClear?: () => void;
	shortcutHint?: React.ReactNode;
	inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const SearchInput: React.FC<SearchInputProps> = ({
	value,
	onChange,
	onClear,
	shortcutHint,
	inputRef,
	placeholder = "Search...",
	className,
	...props
}) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		onChange(event.target.value);
	};

	const inputClasses = cn("font-medium", className);

	const hasRightContent = Boolean(shortcutHint || (onClear && value));
	const suffix = hasRightContent ? (
		<div className="flex items-center gap-2">
			{shortcutHint}
			{onClear && value && (
				<IconButton
					type="button"
					onClick={onClear}
					size="sm"
					variant="subtle"
					aria-label="Clear search"
					className="w-5 h-5 border border-surface-border bg-surface-muted hover:bg-vibrant-pink hover:text-white hover:border-black"
				>
					<X size={12} strokeWidth={3} />
				</IconButton>
			)}
		</div>
	) : undefined;

	return (
		<FieldShell
			size="sm"
			prefix={
				<span className="pointer-events-none">
					<Search size={16} strokeWidth={2.5} />
				</span>
			}
			suffix={suffix}
			innerClassName="hover:bg-surface-elevated"
		>
			<Input
				ref={inputRef ?? undefined}
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
				className={inputClasses}
				{...props}
			/>
		</FieldShell>
	);
};
