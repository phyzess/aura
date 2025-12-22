import { useAtomValue, useSetAtom } from "jotai";
import { Moon, Search as SearchIcon, Sun } from "lucide-react";
import type React from "react";
import { IconButton } from "@/components/ui/IconButton";
import { ShortcutHint } from "@/components/ui/ShortcutHint";
import { toggleThemeAtom } from "@/store/actions";
import { themeModeAtom } from "@/store/atoms";

interface HeaderProps {
	workspaceName: string;
	onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
	workspaceName,
	onOpenSearch,
}) => {
	const theme = useAtomValue(themeModeAtom);
	const toggleTheme = useSetAtom(toggleThemeAtom);

	return (
		<header className="h-16 sm:h-20 flex items-center px-4 sm:px-6 md:px-8 justify-between shrink-0 z-10">
			<div className="flex items-center gap-4">
				<div>
					<h2 className="text-2xl font-bold text-primary tracking-tight transition-colors">
						{workspaceName}
					</h2>
				</div>
			</div>
			<div className="flex items-center gap-3 sm:gap-4">
				{onOpenSearch && (
					<>
						<div className="hidden md:inline-flex group bottom-shadow-wrapper bottom-shadow-md rounded-xl">
							<button
								type="button"
								onClick={onOpenSearch}
								className="relative z-10 inline-flex items-center gap-2 px-3 py-1.5 bg-surface-elevated rounded-xl border-2 border-surface-border text-xs font-semibold text-secondary transition-colors hover:border-vibrant-cyan focus:outline-none"
								aria-label="Search saved tabs (⌘K)"
							>
								<SearchIcon size={14} className="text-muted" />
								<span>Search</span>
								<ShortcutHint
									keys={["\u2318", "K"]}
									className="hidden sm:inline-flex"
								/>
							</button>
						</div>

						<IconButton
							type="button"
							variant="subtle"
							size="md"
							onClick={onOpenSearch}
							aria-label="Search saved tabs"
							className="inline-flex md:hidden"
						>
							<SearchIcon size={16} className="text-muted" />
						</IconButton>
					</>
				)}

				<IconButton
					type="button"
					variant="subtle"
					size="md"
					onClick={toggleTheme}
					aria-label="Toggle theme"
					className="w-10 h-10 rounded-full bg-surface-elevated border-2 border-surface-border shadow-sm text-secondary hover:text-black dark:hover:text-white hover:bg-vibrant-yellow transition-all hover:scale-105 active:scale-95"
					title="Toggle Theme"
				>
					{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
				</IconButton>
			</div>
		</header>
	);
};
