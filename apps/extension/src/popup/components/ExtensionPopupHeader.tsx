import { LogIn, Save } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { AuraLogo } from "../../components/AuraLogo";

interface ExtensionPopupHeaderProps {
	searchQuery: string;
	breadcrumbs: { label: string; onClick?: () => void; isCurrent?: boolean }[];
	showLoginButton?: boolean;
	onLoginClick?: () => void;
	onOpenSaveDrawer: () => void;
	onSearchChange: (value: string) => void;
	onClearSearch: () => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
}

export const ExtensionPopupHeader: React.FC<ExtensionPopupHeaderProps> = ({
	searchQuery,
	breadcrumbs,
	showLoginButton = false,
	onLoginClick,
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
						aria-label="Save all open tabs into a collection"
						title="Save all open tabs into a collection"
					>
						<Save size={14} />
						<span className="text-xs font-medium whitespace-nowrap">
							Save tabs
						</span>
					</Button>
					{showLoginButton && (
						<Button
							type="button"
							onClick={onLoginClick}
							variant="ghost"
							iconOnly
							className="w-8 h-8 rounded-lg"
							aria-label="Log in to sync"
							title="Log in to sync"
						>
							<LogIn size={14} />
						</Button>
					)}
				</div>
			</div>

			<SearchInput
				value={searchQuery}
				onChange={onSearchChange}
				onClear={onClearSearch}
				inputRef={inputRef}
				placeholder="Search tabs..."
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
