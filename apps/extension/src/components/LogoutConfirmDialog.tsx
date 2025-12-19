import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

interface LogoutConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (options: { clearLocalData: boolean }) => void;
}

export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
	isOpen,
	onClose,
	onConfirm,
}) => {
	const [choice, setChoice] = useState<"keep" | "clear">("keep");

	const handleConfirm = () => {
		onConfirm({ clearLocalData: choice === "clear" });
	};

	const baseOptionClass =
		"w-full text-left rounded-2xl border px-4 py-3 transition-all bg-surface-elevated";
	const selectedClass =
		"border-accent ring-2 ring-accent-soft/60 shadow-sm bg-accent-soft/15";
	const unselectedClass =
		"border-surface-border/80 bg-surface-muted/60 hover:bg-surface-muted/80 hover:border-accent/60";

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			size="md"
			className="shadow-soft border border-surface px-7 py-6 animate-in fade-in zoom-in-95 duration-200"
		>
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2 max-w-md mx-auto w-full">
					<h3 className="text-xl font-bold text-primary tracking-tight">
						Log out
					</h3>
					<p className="mt-1 text-[13px] text-secondary leading-relaxed">
						You can choose whether to clear the spaces, collections, and tabs
						saved on this device.
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
				<div className="flex gap-3 w-full mt-1 max-w-md mx-auto">
					<Button variant="ghost" onClick={onClose} className="flex-1">
						Cancel
					</Button>
					<Button variant="primary" onClick={handleConfirm} className="flex-1">
						Continue
					</Button>
				</div>
			</div>
		</Dialog>
	);
};
