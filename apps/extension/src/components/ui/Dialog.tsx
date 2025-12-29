import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { createPortal } from "react-dom";
import { modalAnimation, overlayAnimation } from "@/config/animations";
import { cn } from "@/lib/utils";

export type DialogSize = "sm" | "md" | "lg" | "xl";
export type DialogPosition = "center" | "top";

interface DialogProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	size?: DialogSize;
	position?: DialogPosition;
	closeOnOverlayClick?: boolean;
	closeOnEsc?: boolean;
	className?: string;
	overlayClassName?: string;
}

export const Dialog: React.FC<DialogProps> = ({
	isOpen,
	onClose,
	children,
	size = "md",
	position = "center",
	closeOnOverlayClick = true,
	closeOnEsc = true,
	className,
	overlayClassName,
}) => {
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

	const content = (
		<AnimatePresence mode="wait">
			{isOpen && (
				<div
					className={cn(
						"fixed inset-0 z-120 flex justify-center p-4",
						positionClass,
					)}
				>
					{/* 遮罩层 */}
					<motion.div
						{...overlayAnimation}
						className={cn(
							"absolute inset-0 bg-surface-overlay backdrop-blur-sm",
							overlayClassName,
						)}
						onClick={closeOnOverlayClick ? onClose : undefined}
					/>

					{/* Dialog 主体 */}
					<motion.div
						{...modalAnimation}
						className={cn(
							"relative w-full bg-surface-elevated rounded-3xl overflow-hidden",
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
