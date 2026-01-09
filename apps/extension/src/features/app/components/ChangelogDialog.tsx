import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import * as m from "@/paraglide/messages";
import { type ChangelogEntry, parseChangelog } from "@/utils/changelogParser";

interface ChangelogDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ChangelogDialog({ isOpen, onClose }: ChangelogDialogProps) {
	const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
	const currentVersion = chrome.runtime.getManifest().version;

	useEffect(() => {
		if (isOpen) {
			loadChangelog();
		}
	}, [isOpen]);

	const loadChangelog = async () => {
		try {
			const response = await fetch(chrome.runtime.getURL("CHANGELOG.md"));
			const text = await response.text();
			const parsed = parseChangelog(text);
			setChangelog(parsed);
		} catch (error) {
			console.error("Failed to load changelog:", error);
		}
	};

	const currentEntry = changelog.find((e) => e.version === currentVersion);
	const otherEntries = changelog.filter((e) => e.version !== currentVersion);

	return (
		<Dialog isOpen={isOpen} onClose={onClose} size="lg" variant="elevated">
			<div className="flex flex-col max-h-[80vh]">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
					<div>
						<h2 className="text-xl font-bold text-primary">
							{m.changelog_dialog_title()}
						</h2>
						<p className="text-sm text-secondary mt-0.5">
							{m.changelog_dialog_version_label({ version: currentVersion })}
						</p>
					</div>
					<IconButton
						variant="subtle"
						size="sm"
						onClick={onClose}
						aria-label={m.changelog_dialog_close_aria()}
					>
						<X size={18} />
					</IconButton>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
					{/* Current Version */}
					{currentEntry && (
						<div className="mb-6">
							<h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">
								{m.changelog_dialog_latest_updates_heading()}
							</h3>
							<ChangelogVersion entry={currentEntry} highlight={true} />
						</div>
					)}

					{/* Previous Versions */}
					{otherEntries.length > 0 && (
						<details className="group">
							<summary className="cursor-pointer text-secondary hover:text-primary transition-colors list-none flex items-center gap-2 mb-4 text-sm font-semibold">
								<span>{m.changelog_dialog_view_previous_versions()}</span>
								<svg
									className="w-4 h-4 transition-transform group-open:rotate-180"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</summary>
							<div className="space-y-6">
								{otherEntries.map((entry) => (
									<ChangelogVersion key={entry.version} entry={entry} />
								))}
							</div>
						</details>
					)}
				</div>
			</div>
		</Dialog>
	);
}

interface ChangelogVersionProps {
	entry: ChangelogEntry;
	highlight?: boolean;
}

function ChangelogVersion({ entry, highlight }: ChangelogVersionProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				<h4
					className={`text-base font-bold ${highlight ? "text-accent" : "text-primary"}`}
				>
					v{entry.version}
				</h4>
				{entry.date && <span className="text-xs text-muted">{entry.date}</span>}
			</div>

			{entry.changes.map((changeGroup, idx) => (
				<div key={idx} className="space-y-2">
					<h5 className="text-xs font-semibold text-secondary uppercase tracking-wide">
						{changeGroup.type} Changes
					</h5>
					<ul className="space-y-1.5 ml-4">
						{changeGroup.items.map((item, itemIdx) => (
							<li
								key={itemIdx}
								className="text-sm text-secondary flex items-start gap-2"
							>
								<span className="text-accent mt-0.5">•</span>
								<span className="flex-1">{item}</span>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}
