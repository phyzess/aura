import { Link2, Type, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import * as m from "@/paraglide/messages";

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
				finalTitle = m.add_tab_modal_fallback_title();
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
							{m.add_tab_modal_title()}
						</h3>
						<p className="text-body text-secondary mt-1 font-medium">
							{m.add_tab_modal_to_prefix()}{" "}
							<span className="text-accent bg-accent-soft/40 px-1.5 py-0.5 rounded-md">
								{collectionName || m.add_tab_modal_collection_fallback()}
							</span>
						</p>
					</div>
					<IconButton
						type="button"
						variant="subtle"
						size="sm"
						aria-label={m.add_tab_modal_close_aria()}
						onClick={onClose}
					>
						<X size={18} />
					</IconButton>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<TextField
						label={m.add_tab_modal_url_label()}
						labelClassName="text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 ml-1"
						type="text"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder={m.add_tab_modal_url_placeholder()}
						prefix={<Link2 size={18} />}
						containerClassName="group"
						ref={inputRef}
					/>

					<TextField
						label={m.add_tab_modal_title_label()}
						labelClassName="text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 ml-1"
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder={m.add_tab_modal_title_placeholder()}
						prefix={<Type size={18} />}
						containerClassName="group"
					/>

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
								<p className="text-label text-accent">
									{m.add_tab_modal_preview_label()}
								</p>
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
							{m.common_cancel()}
						</Button>
						<Button type="submit" disabled={!url.trim()} className="flex-1">
							{m.add_tab_modal_submit_label()}
						</Button>
					</div>
				</form>
			</div>
		</Dialog>
	);
};
