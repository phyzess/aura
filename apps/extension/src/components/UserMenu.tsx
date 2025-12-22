import { LogIn, User } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";

interface UserMenuProps {
	currentUserEmail?: string | null;
	onOpenAuth?: () => void;
	onSignOut?: () => void;
	fullWidth?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
	currentUserEmail,
	onOpenAuth,
	onSignOut,
	fullWidth = true,
}) => {
	const isLoggedIn = Boolean(currentUserEmail);
	const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
	const accountMenuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!isAccountMenuOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (!accountMenuRef.current) return;
			if (accountMenuRef.current.contains(event.target as Node)) return;
			setIsAccountMenuOpen(false);
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isAccountMenuOpen]);

	if (!isLoggedIn) {
		return (
			<Button
				type="button"
				onClick={onOpenAuth}
				variant="ghost"
				iconOnly
				className="w-8 h-8 rounded-lg"
				aria-label="Log in / Sign up"
				title="Log in / Sign up"
			>
				<LogIn size={14} />
			</Button>
		);
	}

	const wrapperBase = "relative flex h-8 items-center justify-center";
	const wrapperClasses = fullWidth
		? `${wrapperBase} w-full px-3`
		: `${wrapperBase} px-1`;

	return (
		<div ref={accountMenuRef} className={wrapperClasses}>
			<IconButton
				type="button"
				variant="subtle"
				size="md"
				onClick={() => setIsAccountMenuOpen((open) => !open)}
				aria-label="Open account menu"
				className="rounded-full bg-surface-elevated border-surface-border w-full"
			>
				<User size={16} />
			</IconButton>
			{isAccountMenuOpen && (
				<div className="absolute inset-x-0 bottom-full mb-1 w-full rounded-t-2xl bg-surface shadow-soft z-50 overflow-hidden">
					{currentUserEmail && (
						<div className="px-3 pt-2 pb-1 text-[11px] text-muted truncate">
							{currentUserEmail}
						</div>
					)}
					<div className="my-1 h-px bg-surface-border/60" />
					<button
						type="button"
						onClick={() => {
							setIsAccountMenuOpen(false);
							onSignOut?.();
						}}
						className="w-full px-3 py-2 text-left text-xs text-secondary hover:bg-surface-muted"
					>
						Log out
					</button>
				</div>
			)}
		</div>
	);
};
