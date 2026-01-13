import toast from "react-hot-toast";
import * as m from "@/paraglide/messages";
import type { OfflineDetectorState, OnlineStatusCallback } from "./core";
import {
	checkConnection,
	createInitialState,
	getStatus,
	markToastShown,
	notifyCallbacks,
	setOffline,
	setOnline,
	subscribe,
	waitForOnline,
} from "./core";

class OfflineDetector {
	private state: OfflineDetectorState;

	constructor() {
		this.state = createInitialState();
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

		setInterval(() => {
			this.checkConnectionPeriodically();
		}, 30000);
	}

	private handleOnline(): void {
		const wasOffline = !this.state.isOnline;
		this.state = setOnline(this.state);

		if (wasOffline) {
			toast.success(m.notification_online(), {
				duration: 3000,
			});
		}

		notifyCallbacks(this.state.callbacks, true);
	}

	private handleOffline(): void {
		this.state = setOffline(this.state);

		if (!this.state.hasShownOfflineToast) {
			toast.error(
				`${m.notification_offline()}\n💾 Your changes will be saved locally and synced when you're back online.`,
				{
					duration: 6000,
					style: {
						maxWidth: "400px",
					},
				},
			);
			this.state = markToastShown(this.state);
		}

		notifyCallbacks(this.state.callbacks, false);
	}

	private async checkConnectionPeriodically(): Promise<void> {
		const result = await checkConnection();

		if (result.ok && result.value) {
			if (!this.state.isOnline) {
				this.handleOnline();
			}
		} else {
			if (this.state.isOnline) {
				this.handleOffline();
			}
		}
	}

	getStatus(): boolean {
		return getStatus(this.state);
	}

	subscribe(callback: OnlineStatusCallback): () => void {
		return subscribe(this.state, callback);
	}

	async waitForOnline(timeoutMs: number = 30000): Promise<boolean> {
		return waitForOnline(this.state, timeoutMs);
	}
}

export const offlineDetector = new OfflineDetector();
