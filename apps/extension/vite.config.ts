import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { minLength, object, parse, pipe, string } from "valibot";
import { defineConfig, loadEnv } from "vite";
import zip from "vite-plugin-zip-pack";
import { name, version } from "../../package.json";
import manifest from "./manifest.config.js";

const extensionEnvSchema = object({
	VITE_API_BASE_URL: pipe(
		string(),
		minLength(1, "VITE_API_BASE_URL is required"),
	),
});

export default defineConfig(({ mode }) => {
	const repoRoot = path.resolve(__dirname, "../..");
	const env = loadEnv(mode, repoRoot, "");

	parse(extensionEnvSchema, env as Record<string, string | undefined>);

	// Build artifact naming: allow overriding via BUILD_META/RELEASE_TAG, otherwise use timestamp
	const buildMeta =
		(env.BUILD_META as string | undefined) ||
		(env.RELEASE_TAG as string | undefined) ||
		process.env.BUILD_META ||
		process.env.RELEASE_TAG;
	const timestamp = new Date()
		.toISOString()
		.replace(/[-:T]/g, "")
		.split(".")[0];
	const zipFileName = buildMeta
		? `crx-${name}-${version}-${buildMeta}.zip`
		: `crx-${name}-${version}-${timestamp}.zip`;

	return {
		root: __dirname,
		envDir: repoRoot,
		build: {
			rollupOptions: {
				input: {
					// Ensure the dashboard HTML is processed by Vite/CRXJS in production builds
					dashboard: path.resolve(__dirname, "pages/dashboard.html"),
				},
			},
		},
		resolve: {
			alias: {
				"@": `${path.resolve(__dirname, "src")}`,
				"@aura/domain": `${path.resolve(
					__dirname,
					"../../packages/domain/src",
				)}`,
			},
		},
		plugins: [
			tailwindcss(),
			react(),
			crx({ manifest }),
			zip({
				outDir: "release",
				outFileName: zipFileName,
			}),
		],
		server: {
			cors: {
				origin: [/chrome-extension:\/\//],
			},
		},
	};
});
