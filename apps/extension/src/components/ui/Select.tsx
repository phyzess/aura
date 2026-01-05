import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import * as m from "@/paraglide/messages";
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
	placeholder = m.select_default_placeholder(),
	icon,
	size = "md",
	emptyMessage = m.select_empty_message(),
}) => {
	const [open, setOpen] = React.useState(false);
	const [focusedIndex, setFocusedIndex] = React.useState(-1);
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const buttonRef = React.useRef<HTMLButtonElement | null>(null);
	const listboxId = React.useId();
	const buttonId = React.useId();

	const selectedLabel =
		options.find((o) => o.value === value)?.label ?? placeholder;
	const selectedIndex = options.findIndex((o) => o.value === value);

	// Close on outside click
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

	// Reset focused index when opening
	React.useEffect(() => {
		if (open) {
			setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
		}
	}, [open, selectedIndex]);

	// Keyboard navigation
	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (!open) {
			// Open on Enter, Space, or Arrow keys
			if (
				event.key === "Enter" ||
				event.key === " " ||
				event.key === "ArrowDown" ||
				event.key === "ArrowUp"
			) {
				event.preventDefault();
				setOpen(true);
			}
			return;
		}

		switch (event.key) {
			case "Escape":
				event.preventDefault();
				setOpen(false);
				buttonRef.current?.focus();
				break;
			case "Enter":
			case " ":
				event.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < options.length) {
					onChange(options[focusedIndex].value);
					setOpen(false);
					buttonRef.current?.focus();
				}
				break;
			case "ArrowDown":
				event.preventDefault();
				setFocusedIndex((prev) =>
					prev < options.length - 1 ? prev + 1 : prev,
				);
				break;
			case "ArrowUp":
				event.preventDefault();
				setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
				break;
			case "Home":
				event.preventDefault();
				setFocusedIndex(0);
				break;
			case "End":
				event.preventDefault();
				setFocusedIndex(options.length - 1);
				break;
		}
	};

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
					ref={buttonRef}
					id={buttonId}
					type="button"
					role="combobox"
					aria-expanded={open}
					aria-controls={listboxId}
					aria-haspopup="listbox"
					aria-label={
						options.find((o) => o.value === value)
							? undefined
							: m.select_aria_label({ placeholder })
					}
					onClick={() => setOpen((prev) => !prev)}
					onKeyDown={handleKeyDown}
					className={`w-full flex items-center justify-between text-secondary focus-visible:outline-none ${buttonTextSize}`}
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
				<div
					id={listboxId}
					role="listbox"
					aria-labelledby={buttonId}
					className="absolute top-full left-0 w-full mt-1 bg-surface-elevated border border-surface rounded-xl shadow-soft max-h-48 overflow-y-auto z-100 custom-scrollbar"
				>
					{options.length > 0 ? (
						<div className="p-1">
							{options.map((opt, index) => (
								<button
									key={opt.value}
									type="button"
									role="option"
									aria-selected={value === opt.value}
									onClick={() => {
										onChange(opt.value);
										setOpen(false);
										buttonRef.current?.focus();
									}}
									onMouseEnter={() => setFocusedIndex(index)}
									className={`w-full px-3 py-2 rounded-lg cursor-pointer truncate flex items-center justify-between ${optionTextSize} ${
										value === opt.value
											? "bg-accent-soft text-accent font-semibold"
											: focusedIndex === index
												? "bg-surface-muted text-secondary"
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
