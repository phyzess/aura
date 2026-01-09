import { WifiOff } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { offlineDetector } from "@/services/offline";

export const OfflineIndicator: React.FC = () => {
	const [isOnline, setIsOnline] = useState(offlineDetector.getStatus());

	useEffect(() => {
		const unsubscribe = offlineDetector.subscribe((status) => {
			setIsOnline(status);
		});

		return unsubscribe;
	}, []);

	if (isOnline) return null;

	return (
		<div
			className={cn(
				"fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
				"flex items-center gap-2 px-4 py-2.5 rounded-full",
				"bg-warning text-warning-foreground shadow-lg",
				"animate-in slide-in-from-bottom-4 duration-300",
				"border border-warning/20",
			)}
		>
			<WifiOff size={16} className="animate-pulse" />
			<span className="text-sm font-medium">
				Offline - Changes saved locally
			</span>
		</div>
	);
};
