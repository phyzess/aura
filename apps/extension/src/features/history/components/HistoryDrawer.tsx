import { useAtomValue, useSetAtom } from "jotai";
import { Clock, RotateCcw, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { IconButton } from "@/components/ui/IconButton";
import { checkoutCommitAtom, historyCommitsAtom } from "@/features";
import type { StateCommit } from "@/types";

interface HistoryDrawerProps {
	isOpen: boolean;
	onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
	isOpen,
	onClose,
}) => {
	const commits = useAtomValue(historyCommitsAtom);
	const checkout = useSetAtom(checkoutCommitAtom);
	const [sortedCommits, setSortedCommits] = useState<StateCommit[]>([]);

	useEffect(() => {
		const commitsArray = Array.from(commits.values());
		const sorted = commitsArray.sort((a, b) => b.timestamp - a.timestamp);
		setSortedCommits(sorted);
	}, [commits]);

	const handleTimeTravel = async (hash: string) => {
		await checkout(hash);
		onClose();
	};

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return "just now";
	};

	const getCommitIcon = (type: StateCommit["type"]) => {
		switch (type) {
			case "CREATE":
				return "➕";
			case "DELETE":
				return "🗑️";
			case "MOVE":
				return "↔️";
			default:
				return "📝";
		}
	};

	return (
		<Drawer
			isOpen={isOpen}
			onClose={onClose}
			direction="right"
			className="w-96 bg-surface-elevated flex flex-col"
			aria-label="Operation History"
		>
			<div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-surface-border bg-surface-elevated shrink-0">
				<div className="flex items-center gap-2">
					<Clock size={18} className="text-accent" />
					<h2 className="text-base font-semibold text-primary tracking-tight">
						Operation History
					</h2>
				</div>
				<IconButton
					type="button"
					variant="subtle"
					size="sm"
					onClick={onClose}
					aria-label="Close history"
					className="w-7 h-7 bg-surface-muted text-muted hover:text-secondary hover:bg-surface-elevated"
				>
					<X size={14} />
				</IconButton>
			</div>

			<div className="flex-1 overflow-y-auto px-4 py-3 bg-surface-base custom-scrollbar">
				{sortedCommits.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center px-6">
						<Clock size={40} className="text-muted mb-2 opacity-40" />
						<p className="text-sm font-medium text-secondary">
							No operation history yet
						</p>
						<p className="text-xs text-tertiary mt-1">
							Your actions will appear here
						</p>
					</div>
				) : (
					<div className="relative">
						{/* Timeline vertical line */}
						<div className="absolute left-4.5 top-3 bottom-3 w-0.5 bg-linear-to-b from-accent/60 via-accent/30 to-accent/10" />

						{sortedCommits.map((commit, index) => (
							<div key={commit.hash} className="relative pb-3 last:pb-0">
								{/* Timeline dot */}
								<div className="absolute left-3.5 top-3.5 w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-surface-base z-10" />

								<div className="ml-10 group">
									<div className="p-3 rounded-2xl bg-surface-elevated hover:bg-surface-muted transition-all border border-surface-border/50 hover:border-surface-border">
										<div className="flex items-start gap-3">
											<span className="text-xl shrink-0 mt-0.5">
												{getCommitIcon(commit.type)}
											</span>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<p className="text-sm font-medium text-primary truncate">
														{commit.message}
													</p>
													{index === 0 && (
														<span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent/15 text-accent rounded">
															Latest
														</span>
													)}
												</div>
												<div className="flex items-center gap-1.5 mt-1">
													<span className="text-xs text-tertiary">
														{formatTime(commit.timestamp)}
													</span>
													<span className="text-xs text-tertiary/50">•</span>
													<span className="text-[10px] font-mono text-tertiary/70">
														{commit.hash}
													</span>
												</div>
											</div>
											<button
												type="button"
												onClick={() => handleTimeTravel(commit.hash)}
												className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-all shrink-0"
												title="Time travel to this state"
												aria-label={`Restore to: ${commit.message}`}
											>
												<RotateCcw size={13} />
											</button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</Drawer>
	);
};
