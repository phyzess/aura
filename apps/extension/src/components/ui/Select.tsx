import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { FieldShell } from "./FieldShell";

export interface SelectOption {
	value: string;
	label: string;
}

export type SelectSize = "sm" | "md";

export interface SelectProps {
	options: SelectOption[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	icon?: React.ReactNode;
	size?: SelectSize;
	emptyMessage?: string;
}

export const Select: React.FC<SelectProps> = ({
	options,
	value,
	onChange,
	placeholder = "Select...",
	icon,
	size = "md",
	emptyMessage = "No options available",
}) => {
	const [open, setOpen] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement | null>(null);

	const selectedLabel =
		options.find((o) => o.value === value)?.label ?? placeholder;

	React.useEffect(() => {
		if (!open) return;
		const handleClick = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	const buttonTextSize = size === "sm" ? "text-xs font-semibold" : "text-body";
	const chevronSize = size === "sm" ? 12 : 16;
	const optionTextSize = size === "sm" ? "text-xs" : "text-body";

	return (
		<div ref={containerRef} className="relative">
			<FieldShell
				size={size}
				variant="default"
				innerClassName="hover:bg-surface-elevated"
			>
				<button
					type="button"
					onClick={() => setOpen((prev) => !prev)}
					className={`w-full flex items-center justify-between text-secondary ${buttonTextSize}`}
				>
					<div className="flex items-center gap-2 min-w-0">
						{icon && <span className="text-muted">{icon}</span>}
						<span
							className={`truncate ${
								!options.find((o) => o.value === value) ? "text-muted" : ""
							}`}
						>
							{selectedLabel}
						</span>
					</div>
					<ChevronDown
						size={chevronSize}
						className={`text-muted transition-transform ${
							open ? "rotate-180" : ""
						}`}
					/>
				</button>
			</FieldShell>

			{open && (
				<div className="absolute top-full left-0 w-full mt-1 bg-surface-elevated border border-surface rounded-xl shadow-soft max-h-48 overflow-y-auto z-50 custom-scrollbar">
					{options.length > 0 ? (
						<div className="p-1">
							{options.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => {
										onChange(opt.value);
										setOpen(false);
									}}
									className={`w-full px-3 py-2 rounded-lg cursor-pointer truncate flex items-center justify-between ${optionTextSize} ${
										value === opt.value
											? "bg-accent-soft text-accent font-semibold"
											: "text-secondary hover:bg-surface-muted"
									}`}
								>
									{opt.label}
									{value === opt.value && (
										<Check size={size === "sm" ? 10 : 14} />
									)}
								</button>
							))}
						</div>
					) : (
						<div className="p-3 text-center text-xs text-muted">
							{emptyMessage}
						</div>
					)}
				</div>
			)}
		</div>
	);
};
