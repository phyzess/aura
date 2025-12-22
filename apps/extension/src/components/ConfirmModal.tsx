import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import * as m from "@/paraglide/messages";

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	title,
	message,
	onConfirm,
	onClose,
}) => {
	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			size="sm"
			className="shadow-soft border border-surface p-6 animate-in fade-in zoom-in-95 duration-200"
		>
			<div className="flex flex-col items-center text-center gap-4">
				<div className="w-14 h-14 rounded-full bg-danger-soft text-danger flex items-center justify-center shadow-sm">
					<AlertTriangle size={28} strokeWidth={2.5} />
				</div>
				<div>
					<h3 className="text-xl font-bold text-primary tracking-tight">
						{title}
					</h3>
					<p className="text-body text-secondary mt-2 leading-relaxed">
						{message}
					</p>
				</div>
				<div className="flex gap-3 w-full mt-4">
					<Button variant="ghost" onClick={onClose} className="flex-1">
						{m.common_cancel()}
					</Button>
					<Button
						variant="destructive"
						onClick={() => {
							onConfirm();
							onClose();
						}}
						className="flex-1"
					>
						{m.common_delete()}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};
