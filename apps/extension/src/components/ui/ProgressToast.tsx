import type React from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Card } from "./Card";

interface ProgressToastProps {
	total: number;
	checked: number;
	onComplete?: () => void;
}

export const ProgressToast: React.FC<ProgressToastProps> = ({
	total,
	checked,
	onComplete,
}) => {
	const progress = total > 0 ? (checked / total) * 100 : 0;

	useEffect(() => {
		if (checked === total && total > 0) {
			onComplete?.();
		}
	}, [checked, total, onComplete]);

	return (
		<Card
			variant="elevated"
			padding="md"
			radius="2xl"
			className="min-w-80 shadow-lg"
		>
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<span className="text-sm font-semibold text-primary">
						Checking links...
					</span>
					<span className="text-xs text-secondary">
						{checked} / {total}
					</span>
				</div>
				<div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
					<div
						className="h-full bg-accent transition-all duration-300 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>
		</Card>
	);
};

export const showProgressToast = (
	total: number,
	onUpdate: (updateProgress: (checked: number) => void) => void,
): string => {
	let currentChecked = 0;

	const toastId = toast.custom(
		(t) => (
			<ProgressToast
				total={total}
				checked={currentChecked}
				onComplete={() => {
					setTimeout(() => {
						toast.dismiss(t.id);
					}, 1000);
				}}
			/>
		),
		{
			duration: Number.POSITIVE_INFINITY,
		},
	);

	const updateProgress = (checked: number) => {
		currentChecked = checked;
		// Force re-render by dismissing and recreating
		toast.dismiss(toastId);
		toast.custom(
			(t) => (
				<ProgressToast
					total={total}
					checked={currentChecked}
					onComplete={() => {
						setTimeout(() => {
							toast.dismiss(t.id);
						}, 1000);
					}}
				/>
			),
			{
				id: toastId,
				duration: Number.POSITIVE_INFINITY,
			},
		);
	};

	onUpdate(updateProgress);

	return toastId;
};
