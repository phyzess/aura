import { DoorOpen, LogIn, Save } from "lucide-react";
import type React from "react";
import { AuraLogo } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import * as m from "@/paraglide/messages";

interface ExtensionPopupHeaderProps {
	searchQuery: string;
	breadcrumbs: { label: string; onClick?: () => void; isCurrent?: boolean }[];
	currentUserEmail?: string | null;
	onOpenAuth?: () => void;
	onSignOut?: () => void;
	onOpenSaveDrawer: () => void;
	onSearchChange: (value: string) => void;
	onClearSearch: () => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
}

export const ExtensionPopupHeader: React.FC<ExtensionPopupHeaderProps> = ({
	searchQuery,
	breadcrumbs,
	currentUserEmail,
	onOpenAuth,
	onSignOut,
	onOpenSaveDrawer,
	onSearchChange,
	onClearSearch,
	inputRef,
}) => {
	return (
		<div className="bg-surface-elevated pt-4 pb-3 px-4 shrink-0 z-10">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2.5">
					<div className="w-9 h-9 rounded-xl overflow-hidden shadow-soft bg-surface-elevated">
						<AuraLogo className="w-full h-full" />
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						onClick={onOpenSaveDrawer}
						size="sm"
						className="flex items-center gap-1.5"
						aria-label={m.popup_header_save_button_aria()}
						title={m.popup_header_save_button_title()}
					>
						<Save size={14} />
						<span className="text-xs font-medium whitespace-nowrap">
							{m.popup_header_save_button_label()}
						</span>
					</Button>
					{!currentUserEmail ? (
						<Button
							type="button"
							onClick={onOpenAuth}
							variant="ghost"
							iconOnly
							className="w-8 h-8 rounded-lg"
							aria-label={m.user_menu_login_signup_button_label()}
							title={m.user_menu_login_signup_button_label()}
						>
							<LogIn size={14} />
						</Button>
					) : (
						<Button
							type="button"
							onClick={onSignOut}
							variant="ghost"
							iconOnly
							className="w-8 h-8 rounded-lg"
							aria-label={m.user_menu_logout()}
							title={m.user_menu_logout()}
						>
							<DoorOpen size={14} />
						</Button>
					)}
				</div>
			</div>

			<SearchInput
				value={searchQuery}
				onChange={onSearchChange}
				onClear={onClearSearch}
				inputRef={inputRef}
				placeholder={m.popup_header_search_placeholder()}
			/>

			{breadcrumbs.length > 0 && (
				<nav className="mt-2 h-5 flex items-center gap-1 text-[11px] font-medium text-secondary truncate">
					{breadcrumbs.map((item, index) => {
						const isLast = index === breadcrumbs.length - 1;
						const clickable = !!item.onClick && !isLast;

						return (
							<div
								key={`${item.label}-${index}`}
								className="flex items-center gap-1 min-w-0"
							>
								{index > 0 && <span className="text-muted">/</span>}
								{clickable ? (
									<Button
										type="button"
										variant="link"
										size="sm"
										onClick={item.onClick}
										className="truncate px-0 py-0 h-auto"
									>
										{item.label}
									</Button>
								) : (
									<span className={`truncate ${isLast ? "text-primary" : ""}`}>
										{item.label}
									</span>
								)}
							</div>
						);
					})}
				</nav>
			)}
		</div>
	);
};
