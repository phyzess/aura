import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuraToast } from "@/components/ui/AuraToast";
import { initLocale } from "@/config/locale";
import App from "./App.tsx";
import "@/styles/global.css";

// Initialize locale and set HTML lang attribute
const locale = initLocale();
document.documentElement.lang = locale;

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<>
			<App />
			<AuraToast />
		</>
	</StrictMode>,
);
