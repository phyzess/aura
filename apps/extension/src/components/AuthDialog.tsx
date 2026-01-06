import { useSetAtom } from "jotai";
import { Lock, Mail, User, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Divider } from "@/components/ui/Divider";
import { InlineError } from "@/components/ui/ErrorMessage";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import { API_BASE_URL } from "@/config/env";
import * as m from "@/paraglide/messages";
import { authClient } from "@/services/authClient";
import { loadCurrentUserAtom, signInAtom, signUpAtom } from "@/store/actions";

interface AuthFormProps {
	onSuccess: () => void;
	onClose: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, onClose }) => {
	const [mode, setMode] = useState<"login" | "register">("login");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Field-level validation errors
	const [nameError, setNameError] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);

	const signIn = useSetAtom(signInAtom);
	const signUp = useSetAtom(signUpAtom);
	const loadCurrentUser = useSetAtom(loadCurrentUserAtom);

	const handleSocialLogin = async (provider: "github" | "google") => {
		setError(null);
		setIsSubmitting(true);

		try {
			// Initiate Better Auth social flow via POST to /api/auth/sign-in/social
			const response = await fetch(`${API_BASE_URL}/api/auth/sign-in/social`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ provider }),
			});

			if (!response.ok) {
				const message = await response.text().catch(() => "");
				throw new Error(message || m.auth_dialog_error_social_start_failed());
			}

			const data = (await response.json().catch(() => ({}))) as {
				url?: string;
				redirect?: boolean;
			};

			if (!data.url) {
				throw new Error(m.auth_dialog_error_social_start_failed());
			}

			// Open provider's OAuth URL in a new tab
			const authTab = await chrome.tabs.create({ url: data.url });

			// Poll for tab URL and closure so we can auto-close and refresh state
			const apiBase = new URL(API_BASE_URL);
			let completed = false;
			const finish = async (success: boolean) => {
				if (completed) return;
				completed = true;
				setIsSubmitting(false);
				if (success) {
					await loadCurrentUser();
					onSuccess();
					toast.success(m.auth_dialog_toast_sign_in_success());
				} else {
					setError(m.auth_dialog_error_oauth_cancelled());
				}
			};

			const checkInterval = setInterval(async () => {
				if (!authTab.id || completed) return;
				try {
					const tab = await chrome.tabs.get(authTab.id);
					if (!tab) {
						clearInterval(checkInterval);
						const session = await authClient.getSession();
						if (session.data?.user) {
							await finish(true);
						} else {
							await finish(false);
						}
						return;
					}

					// If the tab has navigated back to our API root (auth callback page),
					// treat OAuth as completed: close the tab and refresh user state.
					if (tab.url) {
						const url = new URL(tab.url);
						if (url.origin === apiBase.origin && url.pathname === "/") {
							clearInterval(checkInterval);
							try {
								if (authTab.id) {
									await chrome.tabs.remove(authTab.id);
								}
							} catch {
								// ignore
							}

							const session = await authClient.getSession();
							if (session.data?.user) {
								await finish(true);
							} else {
								await finish(false);
							}
						}
					}
				} catch {
					// Tab doesn't exist anymore
					clearInterval(checkInterval);
					const session = await authClient.getSession();
					if (session.data?.user) {
						await finish(true);
					} else {
						await finish(false);
					}
				}
			}, 500);

			// Timeout after 5 minutes
			setTimeout(
				() => {
					if (completed) return;
					clearInterval(checkInterval);
					setIsSubmitting(false);
				},
				5 * 60 * 1000,
			);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: m.auth_dialog_error_social_failed(),
			);
			setIsSubmitting(false);
		}
	};

	const validateName = (value: string): string | null => {
		if (!value.trim()) {
			return "Name is required";
		}
		if (value.trim().length < 2) {
			return "Name must be at least 2 characters";
		}
		return null;
	};

	const validateEmail = (value: string): string | null => {
		if (!value.trim()) {
			return "Email is required";
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(value)) {
			return "Please enter a valid email address";
		}
		return null;
	};

	const validatePassword = (value: string): string | null => {
		if (!value) {
			return "Password is required";
		}
		if (value.length < 6) {
			return "Password must be at least 6 characters";
		}
		return null;
	};

	const handleNameChange = (value: string) => {
		setName(value);
		if (mode === "register") {
			setNameError(validateName(value));
		}
	};

	const handleEmailChange = (value: string) => {
		setEmail(value);
		setEmailError(validateEmail(value));
	};

	const handlePasswordChange = (value: string) => {
		setPassword(value);
		setPasswordError(validatePassword(value));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validate all fields
		const emailErr = validateEmail(email);
		const passwordErr = validatePassword(password);
		const nameErr = mode === "register" ? validateName(name) : null;

		setEmailError(emailErr);
		setPasswordError(passwordErr);
		setNameError(nameErr);

		if (emailErr || passwordErr || nameErr) {
			return;
		}

		setIsSubmitting(true);
		try {
			if (mode === "login") {
				await signIn({ email: email.trim(), password: password.trim() });
				toast.success(m.auth_dialog_toast_sign_in_success());
			} else {
				await signUp({
					name: name.trim(),
					email: email.trim(),
					password: password.trim(),
				});
				toast.success(m.auth_dialog_toast_sign_up_success());
			}
			onSuccess();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : m.auth_dialog_error_generic();

			// Provide more specific error messages
			if (errorMessage.includes("invalid credentials")) {
				setError(
					"Invalid email or password. Please check your credentials and try again.",
				);
			} else if (errorMessage.includes("already exists")) {
				setError(
					"An account with this email already exists. Try signing in instead.",
				);
			} else if (errorMessage.includes("network")) {
				setError("Network error. Please check your connection and try again.");
			} else {
				setError(errorMessage);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="relative overflow-hidden">
			<div className="absolute inset-x-0 top-0 h-20 bg-gradient-accent-soft/20" />

			<div className="relative p-6">
				<div className="flex items-start justify-between mb-6">
					<div>
						<h2 className="text-xl font-bold text-primary tracking-tight">
							{mode === "login"
								? m.auth_dialog_title_login()
								: m.auth_dialog_title_register()}
						</h2>
						<p className="mt-1 text-body text-secondary font-medium">
							{m.auth_dialog_subtitle()}
						</p>
					</div>
					<IconButton
						type="button"
						variant="subtle"
						size="sm"
						aria-label={m.auth_dialog_close_aria()}
						onClick={onClose}
					>
						<X size={18} />
					</IconButton>
				</div>

				<div className="mt-4 space-y-3">
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<Button
							type="button"
							variant="outline"
							fullWidth
							disabled={isSubmitting}
							onClick={() => handleSocialLogin("google")}
							aria-label={m.auth_dialog_button_google_aria()}
						>
							<svg
								className="mr-2 h-4 w-4"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									fill="currentColor"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="currentColor"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="currentColor"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="currentColor"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							<span className="truncate">
								{m.auth_dialog_button_google_aria()}
							</span>
						</Button>

						<Button
							type="button"
							variant="outline"
							fullWidth
							disabled={isSubmitting}
							onClick={() => handleSocialLogin("github")}
							aria-label={m.auth_dialog_button_github_aria()}
						>
							<svg
								className="mr-2 h-4 w-4"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
							<span className="truncate">
								{m.auth_dialog_button_github_aria()}
							</span>
						</Button>
					</div>

					<Divider
						label={m.auth_dialog_separator_or_email()}
						tone="subtle"
						className="mt-4"
					/>
				</div>

				<form onSubmit={handleSubmit} className="mt-4 space-y-4">
					{mode === "register" && (
						<TextField
							label={m.auth_dialog_name_label()}
							type="text"
							value={name}
							onChange={(e) => handleNameChange(e.target.value)}
							placeholder={m.auth_dialog_name_placeholder()}
							size="md"
							prefix={<User size={16} />}
							error={nameError}
						/>
					)}

					<TextField
						label={m.auth_dialog_email_label()}
						type="email"
						value={email}
						onChange={(e) => handleEmailChange(e.target.value)}
						placeholder={m.auth_dialog_email_placeholder()}
						size="md"
						prefix={<Mail size={16} />}
						error={emailError}
					/>

					<TextField
						label={m.auth_dialog_password_label()}
						type="password"
						value={password}
						onChange={(e) => handlePasswordChange(e.target.value)}
						placeholder={m.auth_dialog_password_placeholder()}
						size="md"
						prefix={<Lock size={16} />}
						error={passwordError}
					/>

					{error && <InlineError message={error} className="mt-2" />}

					<Button
						type="submit"
						fullWidth
						disabled={
							isSubmitting ||
							!email.trim() ||
							!password.trim() ||
							(mode === "register" && !name.trim())
						}
						className="mt-1"
					>
						{isSubmitting
							? mode === "login"
								? m.auth_dialog_button_signing_in()
								: m.auth_dialog_button_creating_account()
							: mode === "login"
								? m.auth_dialog_button_sign_in()
								: m.auth_dialog_button_sign_up()}
					</Button>

					<div className="mt-3 text-left text-xs text-secondary">
						{mode === "login" ? (
							<>
								{m.auth_dialog_prompt_no_account_prefix()}{" "}
								<Button
									variant="link"
									className="p-0 font-semibold text-brand hover:underline"
									onClick={() => {
										setMode("register");
										setError(null);
									}}
								>
									{m.auth_dialog_tab_register()}
								</Button>
							</>
						) : (
							<>
								{m.auth_dialog_prompt_has_account_prefix()}{" "}
								<Button
									variant="link"
									className="p-0 font-semibold text-brand hover:underline"
									onClick={() => {
										setMode("login");
										setError(null);
									}}
								>
									{m.auth_dialog_tab_login()}
								</Button>
							</>
						)}
					</div>
				</form>
			</div>
		</div>
	);
};

interface AuthDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, onClose }) => {
	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			size="md"
			className="shadow-2xl ring-1 ring-white/50 dark:ring-slate-800 overflow-hidden"
		>
			<AuthForm onSuccess={onClose} onClose={onClose} />
		</Dialog>
	);
};
