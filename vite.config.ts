import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	server: {
		host: true,
		allowedHosts: true,
	},
	resolve: { tsconfigPaths: true },
	plugins: [
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
		nitro({
			preset: "bun",
			compressPublicAssets: {
				gzip: true,
				brotli: true,
			},
			plugins: ["server/plugins/notification-poller.ts"],
		}),
	],
	build: {
		cssCodeSplit: true,
		cssMinify: "lightningcss",
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Vendor-Chunks für besseres Caching
					if (id.includes("node_modules")) {
						if (id.includes("@tanstack")) return "vendor-tanstack";
						if (id.includes("react") || id.includes("react-dom"))
							return "vendor-react";
						return "vendor";
					}
				},
			},
		},
	},
});

export default config;
