import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import * as m from "@/paraglide/messages";

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onClose: () => void;
	confirmLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	title,
	message,
	onConfirm,
	onClose,
	confirmLabel,
}) => {
	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			size="sm"
			className="bg-transparent shadow-none border-none p-0 animate-in fade-in zoom-in-95 duration-200"
		>
			<Card
				variant="elevated"
				padding="lg"
				radius="3xl"
				className="shadow-soft border border-surface"
			>
				<CardBody className="flex flex-col items-center text-center gap-4">
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
				</CardBody>
				<CardFooter className="w-full mt-4 gap-3">
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
						{confirmLabel ?? m.common_delete()}
					</Button>
				</CardFooter>
			</Card>
		</Dialog>
	);
};
