import { useAtomValue } from "jotai";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import * as m from "@/paraglide/messages";
import { authErrorAtom, authStatusAtom } from "@/store/atoms";

interface LogoutConfirmBaseProps {
	onClose: () => void;
	onConfirm: (options: { clearLocalData: boolean }) => void;
}

export const LogoutConfirmContent: React.FC<LogoutConfirmBaseProps> = ({
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
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-2 max-w-md mx-auto w-full">
				<h3 className="text-xl font-bold text-primary tracking-tight">
					{m.user_menu_logout()}
				</h3>
				<p className="mt-1 text-[13px] text-secondary leading-relaxed">
					{m.logout_dialog_description()}
				</p>
			</div>
			<div className="space-y-3 text-xs max-w-md mx-auto w-full">
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
			{error && (
				<p className="text-xs text-red-500 max-w-md mx-auto w-full">{error}</p>
			)}
			<div className="flex gap-3 w-full mt-1 max-w-md mx-auto">
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

interface LogoutConfirmDialogProps extends LogoutConfirmBaseProps {
	isOpen: boolean;
}

export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
	isOpen,
	onClose,
	onConfirm,
}) => {
	return (
		<Dialog isOpen={isOpen} onClose={onClose} size="md" variant="elevated">
			<div className="px-7 py-6">
				<LogoutConfirmContent onClose={onClose} onConfirm={onConfirm} />
			</div>
		</Dialog>
	);
};
