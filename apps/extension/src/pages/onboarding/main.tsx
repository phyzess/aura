import { createRoot } from "react-dom/client";
import { AuraToast } from "@/components/ui/AuraToast";
import { initLocale } from "@/config/locale";
import App from "./App";
import "@/styles/global.css";

initLocale();

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<>
			<App />
			<AuraToast />
		</>,
	);
}

