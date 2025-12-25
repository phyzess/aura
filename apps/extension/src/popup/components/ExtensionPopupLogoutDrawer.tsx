import { useAtomValue } from "jotai";
import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { IconButton } from "@/components/ui/IconButton";
import * as m from "@/paraglide/messages";
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
						{m.user_menu_logout()}
					</h2>
					<p className="mt-1 text-[11px] text-secondary leading-snug">
						{m.logout_dialog_description()}
					</p>
				</div>
				<IconButton
					type="button"
					variant="subtle"
					size="sm"
					aria-label={m.logout_dialog_close_drawer_aria()}
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
						{m.logout_dialog_option_keep_title()}
					</div>
					<p className="mt-1 text-[11px] leading-snug text-secondary">
						{m.logout_dialog_option_keep_body()}
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
						{m.logout_dialog_option_clear_title()}
					</div>
					<p className="mt-1 text-[11px] leading-snug text-secondary">
						{m.logout_dialog_option_clear_body()}
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
					{m.common_cancel()}
				</Button>
				<Button
					variant="primary"
					onClick={handleConfirm}
					className="flex-1"
					disabled={isSigningOut}
				>
					{isSigningOut
						? m.logout_dialog_button_logging_out()
						: m.logout_dialog_button_continue()}
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
			className="bg-surface-elevated rounded-t-4xl shadow-soft flex flex-col"
		>
			<PopupLogoutContent onClose={onClose} onConfirm={onConfirm} />
		</Drawer>
	);
};
