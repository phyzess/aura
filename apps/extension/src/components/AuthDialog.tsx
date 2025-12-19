import { useSetAtom } from "jotai";
import { Lock, Mail, User, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { signInAtom, signUpAtom } from "@/store/actions";

interface AuthDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, onClose }) => {
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
			onClose();
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
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			size="md"
			className="shadow-2xl ring-1 ring-white/50 dark:ring-slate-800 overflow-hidden"
		>
			<div className="absolute inset-x-0 top-0 h-20 bg-gradient-accent-soft/20" />

			<div className="relative p-6">
				<div className="flex items-start justify-between mb-6">
					<div>
						<h2 className="text-xl font-bold text-primary tracking-tight">
							{mode === "login"
								? "Sign in to Aura"
								: "Create your Aura account"}
						</h2>
						<p className="mt-1 text-body text-secondary font-medium">
							Sign in to sync your spaces across devices. Local data still works
							offline.
						</p>
					</div>
					<IconButton
						type="button"
						variant="subtle"
						size="sm"
						aria-label="Close auth dialog"
						onClick={onClose}
					>
						<X size={18} />
					</IconButton>
				</div>

				<div className="flex mb-5 rounded-full bg-surface-muted p-1 text-xs font-semibold">
					<button
						type="button"
						onClick={() => setMode("login")}
						className={`flex-1 py-1.5 rounded-full transition-all ${mode === "login" ? "bg-surface-elevated text-primary shadow-sm" : "text-muted"}`}
					>
						Log in
					</button>
					<button
						type="button"
						onClick={() => setMode("register")}
						className={`flex-1 py-1.5 rounded-full transition-all ${mode === "register" ? "bg-surface-elevated text-primary shadow-sm" : "text-muted"}`}
					>
						Sign up
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{mode === "register" && (
						<div>
							<label className="block text-[11px] font-semibold text-secondary mb-1 ml-0.5">
								Name
							</label>
							<div className="relative group bottom-shadow-wrapper bottom-shadow-lg bottom-shadow-focus rounded-xl">
								<div className="pointer-events-none absolute left-3 top-2.5 text-muted z-20">
									<User size={16} />
								</div>
								<Input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Your name"
									size="md"
									hasLeftIcon
									className="relative z-10 px-9"
								/>
							</div>
						</div>
					)}

					<div>
						<label className="block text-[11px] font-semibold text-secondary mb-1 ml-0.5">
							Email
						</label>
						<div className="relative group bottom-shadow-wrapper bottom-shadow-lg bottom-shadow-focus rounded-xl">
							<div className="pointer-events-none absolute left-3 top-2.5 text-muted z-20">
								<Mail size={16} />
							</div>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								size="md"
								hasLeftIcon
								className="relative z-10 px-9"
							/>
						</div>
					</div>

					<div>
						<label className="block text-[11px] font-semibold text-secondary mb-1 ml-0.5">
							Password
						</label>
						<div className="relative group bottom-shadow-wrapper bottom-shadow-lg bottom-shadow-focus rounded-xl">
							<div className="pointer-events-none absolute left-3 top-2.5 text-muted z-20">
								<Lock size={16} />
							</div>
							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="At least 8 characters"
								size="md"
								hasLeftIcon
								className="relative z-10 px-9"
							/>
						</div>
					</div>

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
								? "Signing in..."
								: "Creating account..."
							: mode === "login"
								? "Sign in"
								: "Sign up"}
					</Button>
				</form>
			</div>
		</Dialog>
	);
};
