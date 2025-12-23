import { Toaster } from "react-hot-toast";
import "./styles.css";

export function AuraToast() {
	return (
		<Toaster
			position="top-center"
			gutter={16}
			containerStyle={{ top: 32 }}
			toastOptions={{
				className: "toast-aura",
				success: {
					className: "toast-aura toast-aura--success",
					iconTheme: {
						primary: "var(--color-success)",
						secondary: "var(--color-surface-elevated)",
					},
				},
				error: {
					className: "toast-aura toast-aura--error",
					iconTheme: {
						primary: "var(--color-danger)",
						secondary: "var(--color-surface-elevated)",
					},
				},
			}}
		/>
	);
}
