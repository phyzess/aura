import fs from "node:fs";
import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { minLength, object, parse, pipe, string } from "valibot";
import { defineConfig, loadEnv } from "vite";
import compress from "vite-plugin-compression2";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
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
			reportCompressedSize: true,
			chunkSizeWarningLimit: 500,
			rollupOptions: {
				input: {
					// Ensure the dashboard, newtab, options, and onboarding HTML are processed by Vite/CRXJS in production builds
					dashboard: path.resolve(__dirname, "pages/dashboard.html"),
					newtab: path.resolve(__dirname, "pages/newtab.html"),
					options: path.resolve(__dirname, "pages/options.html"),
					onboarding: path.resolve(__dirname, "pages/onboarding.html"),
				},
				output: {
					manualChunks: (id) => {
						// Vendor chunks for large dependencies
						if (id.includes("node_modules")) {
							// React ecosystem
							if (id.includes("react") || id.includes("react-dom")) {
								return "vendor-react";
							}
							// State management
							if (id.includes("jotai")) {
								return "vendor-jotai";
							}
							// UI libraries
							if (id.includes("lucide-react")) {
								return "vendor-icons";
							}
							if (
								id.includes("@dnd-kit") ||
								id.includes("@formkit/auto-animate") ||
								id.includes("motion")
							) {
								return "vendor-ui";
							}
							// Auth
							if (id.includes("better-auth")) {
								return "vendor-auth";
							}
							// Logging
							if (id.includes("@logtape")) {
								return "vendor-logger";
							}
							// Other vendors
							return "vendor-misc";
						}

						// Feature-based chunks
						if (id.includes("/features/history/")) {
							return "feature-history";
						}
						if (
							id.includes("/features/export/") ||
							id.includes("/features/import/")
						) {
							return "feature-io";
						}
					},
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
		css: {
			devSourcemap: true,
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
			// Optimize images - only in production
			...(mode === "production"
				? [
						ViteImageOptimizer({
							png: {
								quality: 85,
							},
							jpeg: {
								quality: 85,
							},
							jpg: {
								quality: 85,
							},
							webp: {
								quality: 90,
							},
							svg: {
								multipass: true,
								plugins: [
									{
										name: "preset-default",
										params: {
											overrides: {
												removeViewBox: false,
												cleanupIds: false,
											},
										},
									},
								],
							},
						}),
					]
				: []),
			// Compress output files (gzip) - only in production
			...(mode === "production"
				? [
						compress({
							include: /\.(js|css|html|json)$/,
							threshold: 1024,
							deleteOriginalAssets: false,
						}),
					]
				: []),
			// Copy CHANGELOG.md to dist
			{
				name: "copy-changelog",
				writeBundle() {
					const changelogSrc = path.resolve(__dirname, "CHANGELOG.md");
					const changelogDest = path.resolve(__dirname, "dist/CHANGELOG.md");
					if (fs.existsSync(changelogSrc)) {
						fs.copyFileSync(changelogSrc, changelogDest);
						console.log("✓ Copied CHANGELOG.md to dist");
					}
				},
			},
			// Bundle analyzer - only when ANALYZE=true
			...(env.ANALYZE === "true"
				? [
						visualizer({
							filename: "dist/stats.html",
							open: true,
							gzipSize: true,
							brotliSize: true,
							template: "treemap",
						}),
					]
				: []),
		],
		server: {
			cors: {
				origin: [/chrome-extension:\/\//],
			},
		},
	};
});
