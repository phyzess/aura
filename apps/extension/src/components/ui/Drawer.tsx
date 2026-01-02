import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { createPortal } from "react-dom";
import { overlayAnimation, TRANSITIONS } from "@/config/animations";
import { cn } from "@/lib/utils";

interface DrawerProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	className?: string;
	overlayClassName?: string;
	closeOnOverlayClick?: boolean;
	closeOnEsc?: boolean;
	/** Drawer 方向 */
	direction?: "bottom" | "right" | "left";
	/** ARIA label for the drawer */
	"aria-label"?: string;
	/** ID of the element that labels the drawer */
	"aria-labelledby"?: string;
	/** ID of the element that describes the drawer */
	"aria-describedby"?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
	isOpen,
	onClose,
	children,
	className,
	overlayClassName,
	closeOnOverlayClick = true,
	closeOnEsc = true,
	direction = "bottom",
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledby,
	"aria-describedby": ariaDescribedby,
}) => {
	const drawerRef = React.useRef<HTMLDivElement>(null);
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

	// Focus management
	React.useEffect(() => {
		if (!isOpen) return;

		// Save the currently focused element
		previousActiveElement.current = document.activeElement as HTMLElement;

		// Focus the drawer after a short delay
		const timeoutId = setTimeout(() => {
			if (drawerRef.current) {
				const focusableElements =
					drawerRef.current.querySelectorAll<HTMLElement>(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
					);
				if (focusableElements.length > 0) {
					focusableElements[0].focus();
				} else {
					drawerRef.current.focus();
				}
			}
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			// Restore focus when drawer closes
			if (previousActiveElement.current) {
				previousActiveElement.current.focus();
			}
		};
	}, [isOpen]);

	const directionVariants = {
		bottom: {
			hidden: { y: "100%" },
			visible: { y: 0 },
			exit: { y: "100%" },
		},
		right: {
			hidden: { x: "100%" },
			visible: { x: 0 },
			exit: { x: "100%" },
		},
		left: {
			hidden: { x: "-100%" },
			visible: { x: 0 },
			exit: { x: "-100%" },
		},
	};

	const directionClasses = {
		bottom: "bottom-0 left-0 w-full",
		right: "right-0 top-0 h-full",
		left: "left-0 top-0 h-full",
	};

	const content = (
		<AnimatePresence mode="wait">
			{isOpen && (
				<div className="fixed inset-0 z-120">
					{/* 遮罩层 */}
					<motion.div
						{...overlayAnimation}
						className={cn(
							"fixed inset-0 bg-surface-overlay/70 backdrop-blur-sm",
							overlayClassName,
						)}
						onClick={closeOnOverlayClick ? onClose : undefined}
					/>

					{/* Drawer 主体 */}
					<motion.div
						ref={drawerRef}
						role="dialog"
						aria-modal="true"
						aria-label={ariaLabel}
						aria-labelledby={ariaLabelledby}
						aria-describedby={ariaDescribedby}
						tabIndex={-1}
						variants={directionVariants[direction]}
						initial="hidden"
						animate="visible"
						exit="exit"
						transition={TRANSITIONS.spring}
						className={cn(
							"fixed pointer-events-auto",
							directionClasses[direction],
							className,
						)}
					>
						{children}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);

	return createPortal(content, document.body);
};
