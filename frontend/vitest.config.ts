import { playwright } from "@vitest/browser-playwright"
import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config"

import { baseConfigFn } from "./vite.config"

export default defineConfig((env) =>
	mergeConfig(baseConfigFn(env), {
		test: {
			// `pnpm coverage` : couverture v8 sur les deux projets, rapport texte
			// dans le terminal, résumé dans coverage/coverage-summary.txt (repris par la CI).
			coverage: {
				provider: "v8",
				include: ["src/**/*.{ts,tsx}"],
				exclude: [
					"src/**/*.test.{ts,tsx}",
					"src/**/*.stories.tsx",
					"src/**/*.d.ts",
					"src/test/**",
					"src/mocks/**",
					"src/routeTree.gen.ts"
				],
				reporter: ["text", ["text-summary", { file: "coverage-summary.txt" }]]
			},
			projects: [
				{
					// Pure logic (schemas, storage, URL building): no Chromium, runs in
					// well under a second. Anything that renders or needs canvas /
					// IndexedDB belongs to the browser project below.
					test: {
						name: "unit",
						environment: "happy-dom",
						alias: {
							"@/": new URL("./src/", import.meta.url).pathname
						},
						exclude: ["src/**/*.browser.test.tsx"],
						include: ["src/**/*.test.ts"]
					}
				},
				{
					test: {
						alias: {
							"@/": new URL("./src/", import.meta.url).pathname
						},
						setupFiles: ["./src/test/setup.browser.ts"],
						include: ["src/**/*.browser.test.tsx"],
						name: "browser",
						browser: {
							enabled: true,
							// https://vitest.dev/guide/browser/playwright
							provider: playwright(),
							instances: [{ browser: "chromium" }]
						}
					}
				}
			]
		}
	} satisfies ViteUserConfig)
)
