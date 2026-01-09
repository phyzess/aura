import type React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { AuthForm } from "@/features/auth/components/AuthDialog";

interface ExtensionPopupAuthDrawerProps {
	isOpen: boolean;
	onClose: () => void;
}

export const ExtensionPopupAuthDrawer: React.FC<
	ExtensionPopupAuthDrawerProps
> = ({ isOpen, onClose }) => {
	return (
		<Drawer
			isOpen={isOpen}
			onClose={onClose}
			className="bg-surface-elevated rounded-t-4xl shadow-soft flex flex-col max-h-[85%]"
		>
			<div className="w-full max-w-md mx-auto overflow-y-auto">
				<AuthForm onSuccess={onClose} onClose={onClose} />
			</div>
		</Drawer>
	);
};
