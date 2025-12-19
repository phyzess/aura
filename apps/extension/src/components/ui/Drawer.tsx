import * as React from "react";
import { createPortal } from "react-dom";

interface DrawerProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	className?: string;
	overlayClassName?: string;
	closeOnOverlayClick?: boolean;
	closeOnEsc?: boolean;
	animationDurationMs?: number;
}

export const Drawer: React.FC<DrawerProps> = ({
	isOpen,
	onClose,
	children,
	className,
	overlayClassName,
	closeOnOverlayClick = true,
	closeOnEsc = true,
	animationDurationMs = 300,
}) => {
	const [isMounted, setIsMounted] = React.useState(isOpen);

	React.useEffect(() => {
		if (isOpen) {
			setIsMounted(true);
			return;
		}
		const timeoutId = window.setTimeout(() => {
			setIsMounted(false);
		}, animationDurationMs);
		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [isOpen, animationDurationMs]);

	React.useEffect(() => {
		if (!isMounted || !closeOnEsc) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				// Avoid interfering with other handlers
				event.preventDefault();
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isMounted, closeOnEsc, onClose]);

	if (!isMounted) return null;

	const overlayBase =
		"fixed inset-0 bg-surface-overlay/70 backdrop-blur-sm transition-opacity duration-300";
	const overlayClasses = [
		overlayBase,
		isOpen ? "opacity-100" : "opacity-0",
		overlayClassName,
	]
		.filter(Boolean)
		.join(" ");

	const panelBase =
		"fixed bottom-0 left-0 w-full transition-transform duration-300 ease-out";
	const panelClasses = [
		panelBase,
		isOpen ? "translate-y-0" : "translate-y-full",
		className,
	]
		.filter(Boolean)
		.join(" ");

	const content = (
		<div className="fixed inset-0 z-[120] pointer-events-none">
			<div
				className={overlayClasses}
				onClick={closeOnOverlayClick ? onClose : undefined}
			/>
			<div className={panelClasses + " pointer-events-auto"}>{children}</div>
		</div>
	);

	return createPortal(content, document.body);
};
