import { ArrowRight, ExternalLink } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button } from "@/components/ui/Button";
import * as m from "@/paraglide/messages";
import { ChromeService } from "@/services/chrome";

type OpenMode = "new-window" | "current";
type OpenTabsScope = "generic" | "workspace";
type OpenTabsButtonVariant = "menu" | "inline";

type ButtonBaseProps = Omit<
	React.ComponentProps<typeof Button>,
	"onClick" | "children" | "type"
>;

interface ConfirmTexts {
	getTitle: (mode: OpenMode, count: number) => string;
	getMessage: (mode: OpenMode, count: number) => string;
	getConfirmLabel: (mode: OpenMode, count: number) => string;
}

interface OpenTabsButtonProps {
	mode: OpenMode;
	getUrls: () => string[];
	confirmThreshold?: number;
	scope?: OpenTabsScope;
	label?: string;
	variant?: OpenTabsButtonVariant;
	buttonProps?: ButtonBaseProps;
	iconSize?: number;
	showIcon?: boolean;
	onClick?: () => void;
}

const DEFAULT_CONFIRM_THRESHOLD = 15;

export const OpenTabsButton: React.FC<OpenTabsButtonProps> = ({
	mode,
	getUrls,
	confirmThreshold = DEFAULT_CONFIRM_THRESHOLD,
	scope = "generic",
	label,
	variant = "inline",
	buttonProps,
	iconSize = 12,
	showIcon = false,
	onClick,
}) => {
	const [isOpening, setIsOpening] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const baseButtonProps: ButtonBaseProps =
		variant === "menu"
			? {
					variant: "ghost",
					className:
						"w-full flex items-center gap-2 px-3 py-2 text-body font-semibold text-secondary hover:bg-surface-muted hover:text-accent rounded-lg transition-colors text-left justify-start whitespace-nowrap",
				}
			: {
					variant: "link",
					className:
						"flex items-center gap-1 h-6 px-0 text-[11px] text-secondary hover:text-accent",
				};

	const finalButtonProps: ButtonBaseProps = {
		...baseButtonProps,
		...buttonProps,
		className: [baseButtonProps.className, buttonProps?.className]
			.filter(Boolean)
			.join(" "),
	};

	const texts: ConfirmTexts =
		scope === "workspace"
			? {
					getTitle: () => m.workspace_tabs_open_all_confirm_title(),
					getMessage: (openMode, count) =>
						openMode === "new-window"
							? m.workspace_tabs_open_all_confirm_message_new_window({
									count,
								})
							: m.workspace_tabs_open_all_confirm_message_here({
									count,
								}),
					getConfirmLabel: (openMode) =>
						openMode === "new-window"
							? m.common_open_in_new_window()
							: m.common_open_here(),
				}
			: {
					getTitle: () => m.tabs_open_all_confirm_title(),
					getMessage: (openMode, count) =>
						openMode === "new-window"
							? m.tabs_open_all_confirm_message_new_window({ count })
							: m.tabs_open_all_confirm_message_here({ count }),
					getConfirmLabel: (openMode) =>
						openMode === "new-window"
							? m.common_open_in_new_window()
							: m.common_open_here(),
				};

	const resolvedLabel =
		label ??
		(mode === "new-window"
			? m.common_open_in_new_window()
			: m.common_open_here());

	const performOpen = async (urls: string[]) => {
		if (!urls.length) return;
		setIsOpening(true);

		let toastId: string | null = null;

		// Show progress toast for large batches
		if (urls.length >= 5) {
			toastId = toast.loading(`Opening tabs... 0 / ${urls.length}`, {
				duration: Number.POSITIVE_INFINITY,
			});
		}

		try {
			const onProgress = (progress: { total: number; opened: number }) => {
				if (toastId) {
					toast.loading(
						`Opening tabs... ${progress.opened} / ${progress.total}`,
						{
							id: toastId,
						},
					);
				}
			};

			if (mode === "new-window") {
				await ChromeService.openTabsInNewWindow(urls, onProgress);
			} else {
				await ChromeService.openTabs(urls, onProgress);
			}

			if (toastId) {
				toast.success(`Opened ${urls.length} tabs`, { id: toastId });
			}
		} catch (error) {
			console.error("Error opening tabs:", error);
			if (toastId) {
				toast.error(m.tabs_open_error_generic(), { id: toastId });
			} else {
				toast.error(m.tabs_open_error_generic());
			}
		} finally {
			setIsOpening(false);
		}
	};

	const handleClick = () => {
		onClick?.();
		if (isOpening) return;
		const urls = getUrls();
		const count = urls.length;
		if (!count) return;

		if (count >= confirmThreshold) {
			setShowConfirm(true);
			return;
		}

		void performOpen(urls);
	};

	const disabled = isOpening || buttonProps?.disabled;

	const getCount = () => {
		const urls = getUrls();
		return urls.length;
	};

	return (
		<>
			<Button
				type="button"
				size="sm"
				{...finalButtonProps}
				disabled={disabled}
				onClick={handleClick}
			>
				{showIcon &&
					(mode === "new-window" ? (
						<ExternalLink size={iconSize} className="mr-1" />
					) : (
						<ArrowRight size={iconSize} className="mr-1" />
					))}
				{resolvedLabel}
			</Button>
			<ConfirmModal
				isOpen={showConfirm}
				title={texts.getTitle(mode, getCount())}
				message={texts.getMessage(mode, getCount())}
				confirmLabel={texts.getConfirmLabel(mode, getCount())}
				onConfirm={() => {
					const urls = getUrls();
					void performOpen(urls);
				}}
				onClose={() => {
					setShowConfirm(false);
				}}
			/>
		</>
	);
};
