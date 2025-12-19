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

	return {
		root: __dirname,
		envDir: repoRoot,
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
				outFileName: `crx-${name}-${version}.zip`,
			}),
		],
		server: {
			cors: {
				origin: [/chrome-extension:\/\//],
			},
		},
	};
});
