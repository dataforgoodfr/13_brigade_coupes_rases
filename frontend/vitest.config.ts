import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";
import { baseConfigFn } from "./vite.config";

export default defineConfig((env) =>
	mergeConfig(baseConfigFn(env), {
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
