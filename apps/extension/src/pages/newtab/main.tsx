import { createRoot } from "react-dom/client";
import { AuraToast } from "@/components/ui/AuraToast";
import { initLocale } from "@/config/locale";
import * as m from "@/paraglide/messages";
import App from "../dashboard/App";
import "@/styles/global.css";

initLocale();

// Check if new tab override is enabled
async function checkNewTabEnabled() {
	const result = await chrome.storage.local.get(["aura-newtab-enabled"]);
	return result["aura-newtab-enabled"] === true;
}

async function init() {
	const isEnabled = await checkNewTabEnabled();

	if (!isEnabled) {
		// Redirect to Chrome's default new tab page
		// We can't actually restore the default new tab, but we can show a blank page
		// or redirect to chrome://newtab (which won't work due to security)
		// Instead, we'll show a simple page with a link to enable the feature
		const root = document.getElementById("root");
		if (root) {
			const title = m.newtab_disabled_title();
			const description = m.newtab_disabled_description();
			const buttonLabel = m.newtab_disabled_open_settings_button_label();

			root.innerHTML = `
					<div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; font-family: system-ui, -apple-system, sans-serif;">
						<div style="text-align: center; max-width: 500px; padding: 2rem;">
							<h1 style="font-size: 1.5rem; font-weight: 600; color: #1e293b; margin-bottom: 1rem;">
								${title}
							</h1>
							<p style="color: #64748b; margin-bottom: 2rem;">
								${description}
							</p>
							<button 
								onclick="chrome.runtime.openOptionsPage()"
								style="background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; font-size: 1rem;"
							>
								${buttonLabel}
							</button>
						</div>
					</div>
				`;
		}
		return;
	}

	// Show Aura dashboard
	const root = document.getElementById("root");
	if (root) {
		createRoot(root).render(
			<>
				<App />
				<AuraToast />
			</>,
		);
	}
}

init();
