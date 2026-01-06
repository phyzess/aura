declare const chrome: any;

export type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationOptions {
	title: string;
	message: string;
	type?: NotificationType;
	iconUrl?: string;
	requireInteraction?: boolean;
}

class NotificationService {
	private isEnabled = true;
	private readonly DEFAULT_ICON = "/public/logo.png";

	constructor() {
		this.loadSettings();
	}

	private async loadSettings(): Promise<void> {
		try {
			const result = await chrome.storage.local.get(["notificationsEnabled"]);
			this.isEnabled = result.notificationsEnabled ?? true;
		} catch (error) {
			console.error("[Notifications] Failed to load settings:", error);
		}
	}

	/**
	 * Check if notifications are supported and enabled
	 */
	private async canShowNotification(): Promise<boolean> {
		if (!this.isEnabled) {
			return false;
		}

		if (typeof chrome === "undefined" || !chrome.notifications) {
			return false;
		}

		return true;
	}

	/**
	 * Show a notification
	 */
	async show(options: NotificationOptions): Promise<string | null> {
		if (!(await this.canShowNotification())) {
			return null;
		}

		try {
			const notificationId = `aura-${Date.now()}`;

			await chrome.notifications.create(notificationId, {
				type: "basic",
				iconUrl: options.iconUrl || this.DEFAULT_ICON,
				title: options.title,
				message: options.message,
				priority: options.type === "error" ? 2 : 1,
				requireInteraction: options.requireInteraction ?? false,
			});

			// Auto-clear notification after 5 seconds unless requireInteraction is true
			if (!options.requireInteraction) {
				setTimeout(() => {
					this.clear(notificationId);
				}, 5000);
			}

			return notificationId;
		} catch (error) {
			console.error("[Notifications] Failed to show notification:", error);
			return null;
		}
	}

	/**
	 * Clear a notification
	 */
	async clear(notificationId: string): Promise<void> {
		try {
			await chrome.notifications.clear(notificationId);
		} catch (error) {
			console.error("[Notifications] Failed to clear notification:", error);
		}
	}

	/**
	 * Show success notification
	 */
	async success(title: string, message: string): Promise<string | null> {
		return this.show({
			title,
			message,
			type: "success",
		});
	}

	/**
	 * Show error notification
	 */
	async error(
		title: string,
		message: string,
		requireInteraction = false,
	): Promise<string | null> {
		return this.show({
			title,
			message,
			type: "error",
			requireInteraction,
		});
	}

	/**
	 * Show info notification
	 */
	async info(title: string, message: string): Promise<string | null> {
		return this.show({
			title,
			message,
			type: "info",
		});
	}

	/**
	 * Show warning notification
	 */
	async warning(title: string, message: string): Promise<string | null> {
		return this.show({
			title,
			message,
			type: "warning",
		});
	}

	/**
	 * Enable notifications
	 */
	async enable(): Promise<void> {
		this.isEnabled = true;
		await chrome.storage.local.set({ notificationsEnabled: true });
	}

	/**
	 * Disable notifications
	 */
	async disable(): Promise<void> {
		this.isEnabled = false;
		await chrome.storage.local.set({ notificationsEnabled: false });
	}

	/**
	 * Check if notifications are enabled
	 */
	isNotificationsEnabled(): boolean {
		return this.isEnabled;
	}
}

export const notificationService = new NotificationService();
