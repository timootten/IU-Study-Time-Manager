import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	resolve: {
		alias: {
			"#": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./src/tests/setup.ts"],
		testTimeout: 10000,
		hookTimeout: 10000,
		isolate: true,
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"src/tests/",
				"**/*.test.ts",
				"**/*.spec.ts",
			],
		},
	},
});
