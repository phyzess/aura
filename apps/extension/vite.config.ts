import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { minLength, object, parse, pipe, string } from "valibot";
import { defineConfig, loadEnv } from "vite";
import zip from "vite-plugin-zip-pack";
import rootPkg from "../../package.json";
import manifest from "./manifest.config.js";
import extPkg from "./package.json";

const extensionEnvSchema = object({
	VITE_API_BASE_URL: pipe(
		string(),
		minLength(1, "VITE_API_BASE_URL is required"),
	),
});

export default defineConfig(({ mode }) => {
	const repoRoot = path.resolve(__dirname, "../..");
	const fileEnv = loadEnv(mode, repoRoot, "");
	const env = {
		...process.env,
		...fileEnv,
	} as Record<string, string | undefined>;

	parse(extensionEnvSchema, env);

	// Build artifact naming: allow overriding via BUILD_META/RELEASE_TAG, otherwise use timestamp
	const buildMeta =
		(env.BUILD_META as string | undefined) ||
		(env.RELEASE_TAG as string | undefined);
	const timestamp = new Date()
		.toISOString()
		.replace(/[-:T]/g, "")
		.split(".")[0];
	const extensionName = rootPkg.name;
	const extensionVersion = extPkg.version;
	const zipFileName = buildMeta
		? `crx-${extensionName}-${extensionVersion}-${buildMeta}.zip`
		: `crx-${extensionName}-${extensionVersion}-${timestamp}.zip`;

	return {
		root: __dirname,
		envDir: repoRoot,
		build: {
			rollupOptions: {
				input: {
					// Ensure the dashboard, newtab, options, and onboarding HTML are processed by Vite/CRXJS in production builds
					dashboard: path.resolve(__dirname, "pages/dashboard.html"),
					newtab: path.resolve(__dirname, "pages/newtab.html"),
					options: path.resolve(__dirname, "pages/options.html"),
					onboarding: path.resolve(__dirname, "pages/onboarding.html"),
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
			paraglideVitePlugin({
				project: "./project.inlang",
				outdir: "./src/paraglide",
			}),
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
