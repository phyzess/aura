import toast from "react-hot-toast";
import * as m from "@/paraglide/messages";

type OnlineStatusCallback = (isOnline: boolean) => void;

class OfflineDetector {
	private isOnline: boolean = navigator.onLine;
	private callbacks: Set<OnlineStatusCallback> = new Set();
	private hasShownOfflineToast = false;

	constructor() {
		this.setupListeners();
	}

	private setupListeners(): void {
		if (typeof window === "undefined") return;

		window.addEventListener("online", () => {
			this.handleOnline();
		});

		window.addEventListener("offline", () => {
			this.handleOffline();
		});

		// Also check periodically by attempting a fetch
		setInterval(() => {
			this.checkConnection();
		}, 30000); // Check every 30 seconds
	}

	private handleOnline(): void {
		const wasOffline = !this.isOnline;
		this.isOnline = true;
		this.hasShownOfflineToast = false;

		if (wasOffline) {
			toast.success(m.notification_online(), {
				duration: 3000,
			});
		}

		this.notifyCallbacks(true);
	}

	private handleOffline(): void {
		this.isOnline = false;

		if (!this.hasShownOfflineToast) {
			toast.error(m.notification_offline(), {
				duration: 5000,
			});
			this.hasShownOfflineToast = true;
		}

		this.notifyCallbacks(false);
	}

	private async checkConnection(): Promise<void> {
		try {
			// Try to fetch a small resource to check connectivity
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			await fetch("https://www.google.com/favicon.ico", {
				method: "HEAD",
				mode: "no-cors",
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!this.isOnline) {
				this.handleOnline();
			}
		} catch {
			if (this.isOnline) {
				this.handleOffline();
			}
		}
	}

	private notifyCallbacks(isOnline: boolean): void {
		this.callbacks.forEach((callback) => {
			try {
				callback(isOnline);
			} catch (error) {
				console.error("[OfflineDetector] Callback error:", error);
			}
		});
	}

	/**
	 * Get current online status
	 */
	getStatus(): boolean {
		return this.isOnline;
	}

	/**
	 * Subscribe to online status changes
	 */
	subscribe(callback: OnlineStatusCallback): () => void {
		this.callbacks.add(callback);

		// Return unsubscribe function
		return () => {
			this.callbacks.delete(callback);
		};
	}

	/**
	 * Wait for online status
	 */
	async waitForOnline(timeoutMs: number = 30000): Promise<boolean> {
		if (this.isOnline) {
			return true;
		}

		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				unsubscribe();
				resolve(false);
			}, timeoutMs);

			const unsubscribe = this.subscribe((isOnline) => {
				if (isOnline) {
					clearTimeout(timeout);
					unsubscribe();
					resolve(true);
				}
			});
		});
	}
}

export const offlineDetector = new OfflineDetector();

