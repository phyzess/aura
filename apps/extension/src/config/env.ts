import { buildClientConfigFromViteEnv } from "@aura/config";

const clientConfig = buildClientConfigFromViteEnv(
	import.meta.env as unknown as Record<string, unknown>,
);

export const API_BASE_URL = clientConfig.apiBaseUrl;
