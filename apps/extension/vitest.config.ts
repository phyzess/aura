import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["__tests__/setup/test-env.ts"],
		include: ["src/**/__tests__/**/*.test.ts", "__tests__/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts", "src/**/*.tsx"],
			exclude: [
				"src/**/*.d.ts",
				"src/**/index.ts",
				"src/**/__tests__/**",
				"src/paraglide/**",
			],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@aura/domain": path.resolve(__dirname, "../../packages/domain/src"),
			"@aura/shared": path.resolve(__dirname, "../../packages/shared/src"),
		},
	},
});
