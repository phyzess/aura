interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	from?: {
		email: string;
		name?: string;
	};
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
	const fromEmail = options.from?.email || "noreply@aura.app";
	const fromName = options.from?.name || "Aura";

	try {
		const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				personalizations: [
					{
						to: [{ email: options.to }],
					},
				],
				from: {
					email: fromEmail,
					name: fromName,
				},
				subject: options.subject,
				content: [
					{
						type: "text/html",
						value: options.html,
					},
				],
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("[email] Failed to send email:", errorText);
			return {
				success: false,
				error: `Failed to send email: ${response.status}`,
			};
		}

		return { success: true };
	} catch (error) {
		console.error("[email] Error sending email:", error);
		return {
			success: false,
			error: "Failed to send email",
		};
	}
}

export function generateVerificationCode(): string {
	return Math.random().toString().slice(2, 8);
}

export function generateVerificationEmailHTML(code: string): string {
	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
	<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
					<tr>
						<td style="padding: 40px;">
							<h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Verify Your Email</h1>
							<p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #666666;">
								Thank you for signing up! Please use the verification code below to complete your registration:
							</p>
							<div style="background-color: #f8f9fa; border-radius: 6px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
								<div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', monospace;">
									${code}
								</div>
							</div>
							<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: #999999;">
								This code will expire in 10 minutes.
							</p>
							<p style="margin: 0; font-size: 14px; line-height: 20px; color: #999999;">
								If you didn't request this code, please ignore this email.
							</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 40px; border-top: 1px solid #e5e5e5;">
							<p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999; text-align: center;">
								© ${new Date().getFullYear()} Aura. All rights reserved.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`.trim();
}

