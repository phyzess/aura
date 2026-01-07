import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { createPortal } from "react-dom";
import { modalAnimation, overlayAnimation } from "@/config/animations";
import { cn } from "@/lib/utils";

export type DialogSize = "sm" | "md" | "lg" | "xl";
export type DialogPosition = "center" | "top";
export type DialogVariant = "default" | "elevated";

interface DialogProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	size?: DialogSize;
	position?: DialogPosition;
	variant?: DialogVariant;
	closeOnOverlayClick?: boolean;
	closeOnEsc?: boolean;
	className?: string;
	overlayClassName?: string;
	/** ARIA label for the dialog */
	"aria-label"?: string;
	/** ID of the element that labels the dialog */
	"aria-labelledby"?: string;
	/** ID of the element that describes the dialog */
	"aria-describedby"?: string;
}

export const Dialog: React.FC<DialogProps> = ({
	isOpen,
	onClose,
	children,
	size = "md",
	position = "center",
	variant = "default",
	closeOnOverlayClick = true,
	closeOnEsc = true,
	className,
	overlayClassName,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledby,
	"aria-describedby": ariaDescribedby,
}) => {
	const dialogRef = React.useRef<HTMLDivElement>(null);
	const previousActiveElement = React.useRef<HTMLElement | null>(null);

	// Handle Escape key
	React.useEffect(() => {
		if (!isOpen || !closeOnEsc) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, closeOnEsc, onClose]);

	// Focus management and focus trap
	React.useEffect(() => {
		if (!isOpen) return;

		// Save the currently focused element
		previousActiveElement.current = document.activeElement as HTMLElement;

		// Focus the dialog after a short delay to ensure it's rendered
		const timeoutId = setTimeout(() => {
			if (dialogRef.current) {
				const focusableElements =
					dialogRef.current.querySelectorAll<HTMLElement>(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
					);
				if (focusableElements.length > 0) {
					focusableElements[0].focus();
				} else {
					dialogRef.current.focus();
				}
			}
		}, 100);

		// Focus trap
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Tab" || !dialogRef.current) return;

			const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);

			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (event.shiftKey) {
				// Shift + Tab
				if (document.activeElement === firstElement) {
					event.preventDefault();
					lastElement.focus();
				}
			} else {
				// Tab
				if (document.activeElement === lastElement) {
					event.preventDefault();
					firstElement.focus();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("keydown", handleKeyDown);
			// Restore focus when dialog closes
			if (previousActiveElement.current) {
				previousActiveElement.current.focus();
			}
		};
	}, [isOpen]);

	const sizeClass =
		size === "sm"
			? "max-w-xs"
			: size === "lg"
				? "max-w-lg"
				: size === "xl"
					? "max-w-2xl"
					: "max-w-md";

	const positionClass =
		position === "top" ? "items-start pt-24" : "items-center";

	// Unified dialog styling with enhanced contrast for dark mode
	// Using inner glow effect instead of border for better separation
	const variantClass =
		variant === "elevated"
			? "shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_8px_10px_-6px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.1)]"
			: "shadow-2xl";

	const content = (
		<AnimatePresence mode="wait">
			{isOpen && (
				<div
					className={cn(
						"fixed inset-0 z-120 flex justify-center p-4",
						positionClass,
					)}
				>
					{/* 遮罩层 - Enhanced opacity for better contrast */}
					<motion.div
						{...overlayAnimation}
						className={cn(
							"absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm",
							overlayClassName,
						)}
						onClick={closeOnOverlayClick ? onClose : undefined}
					/>

					{/* Dialog 主体 */}
					<motion.div
						ref={dialogRef}
						role="dialog"
						aria-modal="true"
						aria-label={ariaLabel}
						aria-labelledby={ariaLabelledby}
						aria-describedby={ariaDescribedby}
						tabIndex={-1}
						{...modalAnimation}
						className={cn(
							"relative w-full bg-surface-elevated dark:bg-slate-800 rounded-3xl overflow-hidden",
							variantClass,
							sizeClass,
							className,
						)}
						onClick={(event) => event.stopPropagation()}
					>
						{children}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);

	return createPortal(content, document.body);
};
