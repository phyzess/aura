import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initLocale } from "@/config/locale";
import App from "./App.tsx";
import "@/styles/global.css";

initLocale();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
