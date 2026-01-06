interface TurnstileResponse {
	success: boolean;
	"error-codes"?: string[];
	challenge_ts?: string;
	hostname?: string;
}

export async function verifyTurnstile(
	token: string,
	secretKey: string,
	remoteIp?: string,
): Promise<{ success: boolean; error?: string }> {
	if (!secretKey) {
		console.warn(
			"[turnstile] Secret key not configured, skipping verification",
		);
		return { success: true };
	}

	try {
		const formData = new FormData();
		formData.append("secret", secretKey);
		formData.append("response", token);
		if (remoteIp) {
			formData.append("remoteip", remoteIp);
		}

		const response = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				body: formData,
			},
		);

		const data = (await response.json()) as TurnstileResponse;

		if (!data.success) {
			const errorCodes = data["error-codes"]?.join(", ") || "unknown";
			console.error("[turnstile] Verification failed:", errorCodes);
			return {
				success: false,
				error: `Turnstile verification failed: ${errorCodes}`,
			};
		}

		return { success: true };
	} catch (error) {
		console.error("[turnstile] Verification error:", error);
		return {
			success: false,
			error: "Failed to verify Turnstile token",
		};
	}
}
