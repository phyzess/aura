import { LogIn, User as UserIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import * as m from "@/paraglide/messages";

interface UserProps {
	currentUserEmail?: string | null;
	onOpenAuth?: () => void;
	onSignOut?: () => void;
}

export const User: React.FC<UserProps> = ({
	currentUserEmail,
	onOpenAuth,
	onSignOut,
}) => {
	const isLoggedIn = Boolean(currentUserEmail);
	const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

	if (!isLoggedIn) {
		return (
			<Button
				type="button"
				onClick={() => onOpenAuth?.()}
				title={m.sidebar_login_button_title()}
				variant="secondary"
				className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-secondary bg-surface-elevated hover:bg-surface-elevated/90 hover:shadow-sm rounded-r-xl transition-all cursor-pointer"
			>
				<LogIn size={14} />
				<span>{m.sidebar_login_button_label()}</span>
			</Button>
		);
	}

	return (
		<Popover
			isOpen={isAccountMenuOpen}
			positions={["top"]}
			align="start"
			onClickOutside={() => setIsAccountMenuOpen(false)}
			content={
				<div className="w-24">
					{currentUserEmail && (
						<div className="px-3 pt-2 pb-1 text-[11px] text-muted truncate">
							{currentUserEmail}
						</div>
					)}
					<div className="my-1 h-px bg-surface-border/60" />
					<Button
						type="button"
						onClick={() => {
							setIsAccountMenuOpen(false);
							onSignOut?.();
						}}
						variant="ghost"
						className="w-full justify-start rounded-none text-xs"
					>
						{m.user_menu_logout()}
					</Button>
				</div>
			}
		>
			<Button
				type="button"
				onClick={() => setIsAccountMenuOpen((open) => !open)}
				aria-label={m.user_menu_open_account_menu_aria()}
				variant="ghost"
				className="flex-1 h-8 rounded-none rounded-r-xl text-xs"
			>
				<UserIcon size={14} />
				{currentUserEmail && (
					<span className="truncate">{currentUserEmail}</span>
				)}
			</Button>
		</Popover>
	);
};
