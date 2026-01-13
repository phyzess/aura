import { AlertCircle, Info, RefreshCw, X } from "lucide-react";
import type React from "react";
import { Button } from "./Button";

export type ErrorSeverity = "error" | "warning" | "info";

interface ErrorMessageProps {
	title: string;
	message: string;
	severity?: ErrorSeverity;
	suggestion?: string;
	onRetry?: () => void;
	onDismiss?: () => void;
	retryLabel?: string;
	className?: string;
}

const severityConfig = {
	error: {
		icon: AlertCircle,
		bgColor: "bg-red-50 dark:bg-red-950/20",
		borderColor: "border-red-200 dark:border-red-800/30",
		iconColor: "text-red-600 dark:text-red-400",
		titleColor: "text-red-900 dark:text-red-200",
		textColor: "text-red-700 dark:text-red-300",
	},
	warning: {
		icon: AlertCircle,
		bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
		borderColor: "border-yellow-200 dark:border-yellow-800/30",
		iconColor: "text-yellow-600 dark:text-yellow-400",
		titleColor: "text-yellow-900 dark:text-yellow-200",
		textColor: "text-yellow-700 dark:text-yellow-300",
	},
	info: {
		icon: Info,
		bgColor: "bg-blue-50 dark:bg-blue-950/20",
		borderColor: "border-blue-200 dark:border-blue-800/30",
		iconColor: "text-blue-600 dark:text-blue-400",
		titleColor: "text-blue-900 dark:text-blue-200",
		textColor: "text-blue-700 dark:text-blue-300",
	},
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
	title,
	message,
	severity = "error",
	suggestion,
	onRetry,
	onDismiss,
	retryLabel = "Try Again",
	className = "",
}) => {
	const config = severityConfig[severity];
	const Icon = config.icon;

	return (
		<div
			className={`relative rounded-xl border p-4 ${config.bgColor} ${config.borderColor} ${className}`}
			role="alert"
		>
			{onDismiss && (
				<button
					type="button"
					onClick={onDismiss}
					className={`absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${config.iconColor}`}
					aria-label="Dismiss"
				>
					<X size={16} />
				</button>
			)}

			<div className="flex gap-3">
				<div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
					<Icon size={20} />
				</div>

				<div className="flex-1 min-w-0">
					<h3 className={`text-sm font-semibold mb-1 ${config.titleColor}`}>
						{title}
					</h3>

					<p className={`text-sm ${config.textColor} mb-2`}>{message}</p>

					{suggestion && (
						<p className={`text-xs ${config.textColor} opacity-80 mb-3`}>
							💡 {suggestion}
						</p>
					)}

					{onRetry && (
						<Button
							onClick={onRetry}
							size="sm"
							variant="ghost"
							className={`mt-2 ${config.iconColor} hover:bg-black/5 dark:hover:bg-white/5`}
						>
							<RefreshCw size={14} className="mr-1.5" />
							{retryLabel}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};

interface InlineErrorProps {
	message: string;
	className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
	message,
	className = "",
}) => {
	return (
		<div
			className={`flex items-center gap-2 text-xs text-red-600 dark:text-red-400 ${className}`}
			role="alert"
		>
			<AlertCircle size={14} />
			<span>{message}</span>
		</div>
	);
};
