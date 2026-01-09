import { Link2, Type, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { HStack } from "@/components/ui/Stack";
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
	const [urlError, setUrlError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			setUrl("");
			setTitle("");
			setUrlError(null);
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [isOpen]);

	const validateUrl = (value: string): string | null => {
		if (!value.trim()) {
			return "URL is required";
		}

		try {
			const testUrl = value.startsWith("http") ? value : `https://${value}`;
			new URL(testUrl);
			return null;
		} catch {
			return "Please enter a valid URL";
		}
	};

	const handleUrlChange = (value: string) => {
		setUrl(value);
		if (value.trim()) {
			setUrlError(validateUrl(value));
		} else {
			setUrlError(null);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const urlErr = validateUrl(url);
		setUrlError(urlErr);

		if (urlErr) {
			return;
		}

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
			variant="elevated"
			className="shadow-2xl shadow-lavender-500/20 dark:shadow-none ring-1 ring-white/50 dark:ring-slate-800 overflow-hidden"
		>
			<div className="flex flex-col">
				{/* Header */}
				<div className="relative px-6 pt-6 pb-0">
					<div className="absolute top-0 left-0 w-full h-32 bg-gradient-accent-soft/25 pointer-events-none" />
					<div className="relative flex items-start justify-between gap-4">
						<div className="flex-1">
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
							<X size={20} />
						</IconButton>
					</div>
				</div>

				{/* Body */}
				<div className="px-6 pb-6">
					<form onSubmit={handleSubmit} className="space-y-4">
						<TextField
							label={m.add_tab_modal_url_label()}
							labelClassName="text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 ml-1"
							type="text"
							value={url}
							onChange={(e) => handleUrlChange(e.target.value)}
							placeholder={m.add_tab_modal_url_placeholder()}
							prefix={<Link2 size={18} />}
							containerClassName="group"
							ref={inputRef}
							error={urlError}
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
							<HStack
								gap="md"
								className="p-3 bg-accent-soft/40 dark:bg-surface-muted rounded-xl border border-accent/20 dark:border-surface-border"
							>
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
							</HStack>
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
			</div>
		</Dialog>
	);
};
