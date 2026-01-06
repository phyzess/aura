import { Command, Keyboard, X } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { ShortcutHint } from "@/components/ui/ShortcutHint";

interface KeyboardShortcutsDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

interface ShortcutItem {
	keys: string[];
	description: string;
	category: string;
}

const shortcuts: ShortcutItem[] = [
	{
		keys: ["⌘", "K"],
		description: "Open global search",
		category: "Navigation",
	},
	{
		keys: ["⌘", "S"],
		description: "Sync with server",
		category: "Actions",
	},
	{
		keys: ["ESC"],
		description: "Close dialog or modal",
		category: "Navigation",
	},
	{
		keys: ["⌘", "Click"],
		description: "Open tab in background",
		category: "Tabs",
	},
	{
		keys: ["Ctrl", "Click"],
		description: "Open tab in background (Windows)",
		category: "Tabs",
	},
];

export const KeyboardShortcutsDialog: React.FC<
	KeyboardShortcutsDialogProps
> = ({ isOpen, onClose }) => {
	const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			size="lg"
			className="bg-transparent shadow-none border-none p-0"
		>
			<Card
				variant="elevated"
				radius="2xl"
				className="relative w-full border border-surface shadow-soft"
			>
				<CardHeader className="border-b border-surface bg-surface-elevated/80 backdrop-blur-sm">
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent">
								<Keyboard size={20} />
							</div>
							<div>
								<h2 className="text-lg font-bold text-primary">
									Keyboard Shortcuts
								</h2>
								<p className="text-xs text-secondary">
									Quick reference for all available shortcuts
								</p>
							</div>
						</div>
						<IconButton
							type="button"
							variant="subtle"
							size="md"
							onClick={onClose}
							aria-label="Close"
						>
							<X size={18} />
						</IconButton>
					</div>
				</CardHeader>

				<CardBody className="p-6">
					<div className="space-y-6">
						{categories.map((category) => (
							<div key={category}>
								<h3 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
									<Command size={14} className="text-accent" />
									{category}
								</h3>
								<div className="space-y-2">
									{shortcuts
										.filter((s) => s.category === category)
										.map((shortcut, index) => (
											<div
												key={index}
												className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated hover:bg-surface-muted transition-colors"
											>
												<span className="text-sm text-primary">
													{shortcut.description}
												</span>
												<ShortcutHint
													keys={shortcut.keys}
													className="bg-surface border border-surface-border"
												/>
											</div>
										))}
								</div>
							</div>
						))}
					</div>

					<div className="mt-6 pt-4 border-t border-surface">
						<div className="flex items-start gap-2 p-3 rounded-xl bg-accent-soft/10 border border-accent/20">
							<span className="text-accent mt-0.5">💡</span>
							<div className="flex-1">
								<p className="text-xs text-secondary">
									<strong className="text-accent">Tip:</strong> On Windows and
									Linux, use <kbd className="text-xs">Ctrl</kbd> instead of{" "}
									<kbd className="text-xs">⌘</kbd> for most shortcuts.
								</p>
							</div>
						</div>
					</div>

					<div className="mt-4 flex justify-end">
						<Button onClick={onClose} variant="secondary" size="sm">
							Got it
						</Button>
					</div>
				</CardBody>
			</Card>
		</Dialog>
	);
};

