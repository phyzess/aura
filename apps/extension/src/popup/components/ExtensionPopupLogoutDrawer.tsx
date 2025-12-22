import { useAtomValue } from "jotai";
import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { IconButton } from "@/components/ui/IconButton";
import { authErrorAtom, authStatusAtom } from "@/store/atoms";

interface ExtensionPopupLogoutDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (options: { clearLocalData: boolean }) => void | Promise<void>;
}

interface PopupLogoutContentProps {
	onClose: () => void;
	onConfirm: (options: { clearLocalData: boolean }) => void | Promise<void>;
}

const PopupLogoutContent: React.FC<PopupLogoutContentProps> = ({
	onClose,
	onConfirm,
}) => {
	const [choice, setChoice] = useState<"keep" | "clear">("keep");
	const status = useAtomValue(authStatusAtom);
	const error = useAtomValue(authErrorAtom);
	const isSigningOut = status === "signingOut";

	const handleConfirm = () => {
		if (isSigningOut) return;
		onConfirm({ clearLocalData: choice === "clear" });
	};

	const baseOptionClass =
		"w-full text-left rounded-2xl border px-4 py-3 transition-all bg-surface-elevated";
	const selectedClass =
		"border-accent ring-2 ring-accent-soft/60 shadow-sm bg-accent-soft/15";
	const unselectedClass =
		"border-surface-border/80 bg-surface-muted/60 hover:bg-surface-muted/80 hover:border-accent/60";

	return (
		<div className="flex flex-col max-w-md mx-auto w-full">
			<div className="px-5 pt-4 pb-2 shrink-0 flex items-start justify-between">
				<div className="pr-4">
					<h2 className="text-base font-semibold text-primary tracking-tight">
						Log out
					</h2>
					<p className="mt-1 text-[11px] text-secondary leading-snug">
						You can choose whether to clear the spaces, collections, and tabs
						saved on this device.
					</p>
				</div>
				<IconButton
					type="button"
					variant="subtle"
					size="sm"
					aria-label="Close logout drawer"
					onClick={onClose}
					className="w-7 h-7 bg-surface-muted text-muted hover:text-secondary hover:bg-surface-elevated"
				>
					<X size={14} />
				</IconButton>
			</div>

			<div className="px-5 pt-1 pb-2 space-y-3 text-xs">
				<button
					type="button"
					onClick={() => setChoice("keep")}
					className={`${baseOptionClass} ${
						choice === "keep" ? selectedClass : unselectedClass
					}`}
				>
					<div className="text-sm font-semibold text-primary">
						Only log out, keep local data (recommended)
					</div>
					<p className="mt-1 text-[11px] leading-snug text-secondary">
						Your spaces will stay on this device and remain available offline.
					</p>
				</button>
				<button
					type="button"
					onClick={() => setChoice("clear")}
					className={`${baseOptionClass} ${
						choice === "clear" ? selectedClass : unselectedClass
					}`}
				>
					<div className="text-sm font-semibold text-primary">
						Log out and clear local data
					</div>
					<p className="mt-1 text-[11px] leading-snug text-secondary">
						Best for shared or public devices. This removes your spaces from
						this browser.
					</p>
				</button>
			</div>

			{error && <p className="px-5 pb-1 text-[11px] text-red-500">{error}</p>}

			<div className="px-5 py-3 border-t border-surface-border bg-surface-elevated flex gap-2 mt-1">
				<Button
					variant="ghost"
					onClick={onClose}
					className="flex-1"
					disabled={isSigningOut}
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					onClick={handleConfirm}
					className="flex-1"
					disabled={isSigningOut}
				>
					{isSigningOut ? "Logging out..." : "Continue"}
				</Button>
			</div>
		</div>
	);
};

export const ExtensionPopupLogoutDrawer: React.FC<
	ExtensionPopupLogoutDrawerProps
> = ({ isOpen, onClose, onConfirm }) => {
	return (
		<Drawer
			isOpen={isOpen}
			onClose={onClose}
			className="bg-surface-elevated rounded-t-4xl shadow-soft flex flex-col border-t border-surface"
		>
			<PopupLogoutContent onClose={onClose} onConfirm={onConfirm} />
		</Drawer>
	);
};
