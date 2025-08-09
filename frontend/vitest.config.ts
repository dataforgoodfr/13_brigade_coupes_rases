import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";
import { baseConfigFn } from "./vite.config";

export default defineConfig((env) =>
	mergeConfig(baseConfigFn(env), {
		optimizeDeps: { include: ["react-dom/client", " react/jsx-dev-runtime"] },
		test: {
			projects: [
				{
					test: {
						name: "unit",
						exclude: ["src/**/*.browser.test.tsx"],
						include: ["src/**/*.test.ts"],
					},
				},
				{
					test: {
						alias: {
							"@/": new URL("./src/", import.meta.url).pathname,
						},
						setupFiles: ["./src/test/setup.browser.ts"],
						include: ["src/**/*.browser.test.tsx"],
						name: "browser",
						browser: {
							enabled: true,
							provider: "playwright",
							// https://vitest.dev/guide/browser/playwright
							instances: [{ browser: "chromium" }],
						},
					},
				},
			],
		},
	} satisfies ViteUserConfig),
);
