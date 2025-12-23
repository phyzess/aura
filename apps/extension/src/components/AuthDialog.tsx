import { useSetAtom } from "jotai";
import { Lock, Mail, User, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import * as m from "@/paraglide/messages";
import { signInAtom, signUpAtom } from "@/store/actions";

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

	const signIn = useSetAtom(signInAtom);
	const signUp = useSetAtom(signUpAtom);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!email.trim() || !password.trim()) return;
		if (mode === "register" && !name.trim()) return;

		setIsSubmitting(true);
		try {
			if (mode === "login") {
				await signIn({ email: email.trim(), password: password.trim() });
			} else {
				await signUp({
					name: name.trim(),
					email: email.trim(),
					password: password.trim(),
				});
			}
			onSuccess();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Authentication failed. Please try again.",
			);
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

				<div className="flex mb-5 rounded-full bg-surface-muted p-1 text-xs font-semibold">
					<Button
						type="button"
						onClick={() => setMode("login")}
						variant="ghost"
						size="sm"
						className={`flex-1 py-1.5 rounded-full ${mode === "login" ? "bg-surface-elevated text-primary shadow-sm" : "text-muted bg-transparent"}`}
					>
						{m.auth_dialog_tab_login()}
					</Button>
					<Button
						type="button"
						onClick={() => setMode("register")}
						variant="ghost"
						size="sm"
						className={`flex-1 py-1.5 rounded-full ${mode === "register" ? "bg-surface-elevated text-primary shadow-sm" : "text-muted bg-transparent"}`}
					>
						{m.auth_dialog_tab_register()}
					</Button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{mode === "register" && (
						<TextField
							label={m.auth_dialog_name_label()}
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={m.auth_dialog_name_placeholder()}
							size="md"
							prefix={<User size={16} />}
						/>
					)}

					<TextField
						label={m.auth_dialog_email_label()}
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder={m.auth_dialog_email_placeholder()}
						size="md"
						prefix={<Mail size={16} />}
					/>

					<TextField
						label={m.auth_dialog_password_label()}
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder={m.auth_dialog_password_placeholder()}
						size="md"
						prefix={<Lock size={16} />}
					/>

					{error && (
						<div className="text-xs text-danger bg-danger-soft/70 border border-danger/20 rounded-xl px-3 py-2">
							{error}
						</div>
					)}

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
