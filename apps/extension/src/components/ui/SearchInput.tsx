import { Search, X } from "lucide-react";
import type * as React from "react";

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

	const baseInputClasses =
		"relative z-10 w-full bg-surface-elevated border-2 border-surface-border rounded-xl text-body font-medium text-primary placeholder:text-muted focus:outline-none transition-all hover:bg-surface-elevated";

	const paddingClasses = shortcutHint ? "pl-10 pr-20 py-2" : "pl-10 pr-10 py-2";

	const inputClasses = [baseInputClasses, paddingClasses, className]
		.filter(Boolean)
		.join(" ");

	return (
		<div className="relative group bottom-shadow-wrapper bottom-shadow-lg bottom-shadow-focus rounded-xl">
			<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within:text-vibrant-cyan transition-colors z-20">
				<Search size={16} strokeWidth={2.5} />
			</div>
			<input
				ref={inputRef ?? undefined}
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
				className={inputClasses}
				{...props}
			/>
			{(shortcutHint || (onClear && value)) && (
				<div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2 z-20">
					{shortcutHint}
					{onClear && value && (
						<button
							type="button"
							onClick={onClear}
							className="flex items-center text-muted hover:text-secondary cursor-pointer transition-colors"
							aria-label="Clear search"
						>
							<div className="w-5 h-5 rounded-full border border-surface-border bg-surface-muted flex items-center justify-center hover:bg-vibrant-pink hover:text-white hover:border-black">
								<X size={12} strokeWidth={3} />
							</div>
						</button>
					)}
				</div>
			)}
		</div>
	);
};
