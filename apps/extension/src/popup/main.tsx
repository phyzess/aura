import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuraToast } from "@/components/ui/AuraToast";
import { initLocale } from "@/config/locale";
import App from "./App.tsx";
import "@/styles/global.css";

initLocale();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<>
			<App />
			<AuraToast />
		</>
	</StrictMode>,
);
