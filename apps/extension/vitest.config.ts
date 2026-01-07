import { defineConfig } from "vitest/config";

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
			"@": "/src",
			"@aura/domain": "/../../packages/domain/src",
			"@aura/shared": "/../../packages/shared/src",
		},
	},
});

