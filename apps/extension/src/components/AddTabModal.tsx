import { Link2, Type, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";

interface AddTabModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (url: string, title: string) => void;
	collectionName?: string;
}

export const AddTabModal: React.FC<AddTabModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	collectionName,
}) => {
	const [url, setUrl] = useState("");
	const [title, setTitle] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			setUrl("");
			setTitle("");
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [isOpen]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!url.trim()) return;

		let finalTitle = title.trim();
		if (!finalTitle) {
			try {
				const domain = new URL(url.startsWith("http") ? url : `https://${url}`)
					.hostname;
				finalTitle = domain.replace("www.", "");
			} catch (_e) {
				finalTitle = "New Tab";
			}
		}

		let finalUrl = url.trim();
		if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
			finalUrl = `https://${finalUrl}`;
		}

		onConfirm(finalUrl, finalTitle);
		onClose();
	};

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			size="md"
			className="shadow-2xl shadow-lavender-500/20 dark:shadow-none ring-1 ring-white/50 dark:ring-slate-800 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
		>
			<div className="absolute top-0 left-0 w-full h-32 bg-gradient-accent-soft/25 pointer-events-none" />

			<div className="relative p-6">
				<div className="flex justify-between items-start mb-6">
					<div>
						<h3 className="text-xl font-bold text-primary tracking-tight">
							Add New Tab
						</h3>
						<p className="text-body text-secondary mt-1 font-medium">
							to{" "}
							<span className="text-accent bg-accent-soft/40 px-1.5 py-0.5 rounded-md">
								{collectionName || "Collection"}
							</span>
						</p>
					</div>
					<IconButton
						type="button"
						variant="subtle"
						size="sm"
						aria-label="Close"
						onClick={onClose}
					>
						<X size={18} />
					</IconButton>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="group">
						<label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 ml-1">
							URL
						</label>
						<div className="relative">
							<div className="absolute left-3 top-3 text-accent/70 group-focus-within:text-accent dark:text-muted dark:group-focus-within:text-accent transition-colors">
								<Link2 size={18} />
							</div>
							<input
								ref={inputRef}
								type="text"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://example.com"
								className="w-full pl-10 pr-4 py-3 bg-surface-muted border border-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:bg-surface-elevated text-primary placeholder:text-muted font-medium transition-all"
							/>
						</div>
					</div>

					<div className="group">
						<label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 ml-1">
							Title (Optional)
						</label>
						<div className="relative">
							<div className="absolute left-3 top-3 text-accent/70 group-focus-within:text-accent dark:text-muted dark:group-focus-within:text-accent transition-colors">
								<Type size={18} />
							</div>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Design Inspiration"
								className="w-full pl-10 pr-4 py-3 bg-surface-muted border border-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:bg-surface-elevated text-primary placeholder:text-muted font-medium transition-all"
							/>
						</div>
					</div>

					{url && (
						<div className="flex items-center gap-3 p-3 bg-accent-soft/40 dark:bg-surface-muted rounded-xl border border-accent/20 dark:border-surface-border">
							<div className="w-8 h-8 rounded-lg bg-surface-elevated shadow-sm flex items-center justify-center text-accent/80 dark:text-accent overflow-hidden">
								<img
									src={`https://www.google.com/s2/favicons?domain=${url}&sz=64`}
									onError={(e) => {
										e.currentTarget.style.display = "none";
									}}
									alt=""
									className="w-5 h-5"
								/>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-semibold text-secondary truncate">
									{title ||
										(url.length > 30 ? `${url.substring(0, 30)}...` : url)}
								</p>
								<p className="text-label text-accent">Preview</p>
							</div>
						</div>
					)}

					<div className="pt-2 flex gap-3">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!url.trim()} className="flex-1">
							Add Tab
						</Button>
					</div>
				</form>
			</div>
		</Dialog>
	);
};
