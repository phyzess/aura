import { LogIn, Settings, User as UserIcon } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/Button";
import { Menu } from "@/components/ui/Menu";
import * as m from "@/paraglide/messages";

interface UserProps {
	currentUserEmail?: string | null;
	onOpenAuth?: () => void;
	onSignOut?: () => void;
	syncStatus?: "idle" | "syncing" | "success" | "error";
	lastSyncTimestamp?: number | null;
	onSync?: (options: { source: "manual" }) => void;
}

const formatRelativeTime = (timestamp: number | null): string => {
	if (!timestamp) return "";

	const now = Date.now();
	const diff = now - timestamp;
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	return `${days}d ago`;
};

export const User: React.FC<UserProps> = ({
	currentUserEmail,
	onOpenAuth,
	onSignOut,
	syncStatus = "idle",
	lastSyncTimestamp,
	onSync,
}) => {
	const isLoggedIn = Boolean(currentUserEmail);

	if (!isLoggedIn) {
		return (
			<div className="flex-1 flex flex-col gap-2">
				<button
					type="button"
					onClick={() => onOpenAuth?.()}
					title={m.sidebar_login_button_title()}
					className="w-full inline-flex flex-col items-center justify-center gap-1.5 px-3 py-3 bg-surface-muted hover:bg-surface-elevated hover:shadow-[0_0_16px_-2px_var(--color-accent-soft)] hover:scale-[1.02] rounded-xl transition-all duration-200 cursor-pointer border-0 font-medium"
				>
					<div className="flex items-center gap-2">
						<LogIn size={14} className="text-accent" />
						<span className="text-xs font-semibold text-secondary">
							{m.sidebar_login_button_label()}
						</span>
					</div>
					<span className="text-[10px] text-muted leading-tight text-center">
						{m.sidebar_login_prompt()}
					</span>
				</button>
				<Button
					onClick={() => chrome.runtime.openOptionsPage()}
					variant="link"
					size="sm"
					className="w-full px-3 py-1 text-xs text-center text-secondary hover:text-primary transition-colors"
				>
					<Settings size={12} className="inline mr-1" />
					{m.user_menu_settings()}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col gap-2">
			<Menu positions={["top"]} align="start">
				<button
					type="button"
					aria-label={m.user_menu_open_account_menu_aria()}
					className="w-full inline-flex items-center justify-center gap-2 px-3 py-3 bg-surface-muted hover:bg-surface-elevated hover:shadow-[0_0_16px_-2px_var(--color-accent-soft)] hover:scale-[1.02] rounded-xl transition-all duration-200 cursor-pointer border-0 font-medium text-xs"
				>
					<UserIcon size={14} className="text-accent" />
					{currentUserEmail && (
						<span className="truncate text-secondary">{currentUserEmail}</span>
					)}
				</button>

				{currentUserEmail && (
					<>
						<Menu.Header>
							<div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">
								Account
							</div>
							<div className="text-xs text-secondary font-medium truncate">
								{currentUserEmail}
							</div>
						</Menu.Header>
						<Menu.Separator />
					</>
				)}

				<Menu.Content>
					<Menu.Item
						icon={<Settings size={14} />}
						onClick={() => chrome.runtime.openOptionsPage()}
					>
						{m.user_menu_settings()}
					</Menu.Item>

					<Menu.Item
						icon={<LogIn size={14} className="rotate-180" />}
						onClick={() => onSignOut?.()}
						variant="danger"
					>
						{m.user_menu_logout()}
					</Menu.Item>
				</Menu.Content>
			</Menu>

			<div className="flex flex-col gap-0.5">
				<Button
					onClick={() => onSync?.({ source: "manual" })}
					disabled={syncStatus === "syncing"}
					variant="link"
					size="sm"
					className={`w-full px-3 py-1 text-xs text-center transition-colors ${
						syncStatus === "error"
							? "text-danger hover:text-danger/80 cursor-pointer"
							: syncStatus === "syncing"
								? "text-accent/50 cursor-not-allowed"
								: "text-accent/80 hover:text-accent cursor-pointer"
					}`}
				>
					{syncStatus === "idle" || syncStatus === "success"
						? m.sidebar_sync_status_synced()
						: syncStatus === "syncing"
							? m.sidebar_sync_status_syncing()
							: m.sidebar_sync_status_error()}
				</Button>
				{lastSyncTimestamp && syncStatus !== "syncing" && (
					<div className="text-[10px] text-muted text-center px-3">
						{formatRelativeTime(lastSyncTimestamp)}
					</div>
				)}
			</div>
		</div>
	);
};
