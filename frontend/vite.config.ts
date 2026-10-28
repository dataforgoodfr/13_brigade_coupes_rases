import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type PluginOption, type UserConfigFnObject } from "vite"
import { VitePWA, type VitePWAOptions } from "vite-plugin-pwa"
import { reactClickToComponent } from "vite-plugin-react-click-to-component"

import { version } from "./package.json"

type RuntimeCaching = NonNullable<
	VitePWAOptions["workbox"]["runtimeCaching"]
>[number]
/** Map tiles barely change: serve them from the cache, without waiting for a
 * slow network. Tiles are opaque responses (no CORS), hence status 0. */
function cacheTiles(
	cacheName: string,
	urlPattern: RuntimeCaching["urlPattern"]
): RuntimeCaching {
	return {
		urlPattern,
		handler: "CacheFirst",
		method: "GET",
		options: {
			cacheName,
			cacheableResponse: { statuses: [0, 200] },
			expiration: {
				maxEntries: 1000,
				maxAgeSeconds: 60 * 60 * 24 * 30,
				purgeOnQuotaError: true
			}
		}
	}
}
export const baseConfigFn: UserConfigFnObject = ({ mode }) => {
	const isDemo = mode === "demo"
	return {
		// The demo is served from the repository's GitHub Pages
		base: isDemo ? "/13_brigade_coupes_rases/" : "/",
		preview: {
			port: 8000
		},
		server: {
			watch: {
				usePolling: true,
				interval: 1000
			}
		},
		build: { sourcemap: true },
		// Shown on the "À propos" page, to tell which version a phone runs
		define: { __APP_VERSION__: JSON.stringify(version) },
		resolve: { tsconfigPaths: true },
		plugins: [
			VitePWA({
				// The demo's requests are answered by the mock service worker,
				// which cannot share the page with the offline one
				disable: isDemo,
				registerType: "prompt",
				injectRegister: false,
				workbox: {
					maximumFileSizeToCacheInBytes:
						process.env.STORYBOOK === "true"
							? Number.MAX_SAFE_INTEGER
							: undefined,
					globPatterns: [
						"**/*.{js,css,html,svg,png,ico}",
						// Polices : sous-ensemble latin uniquement (≈ 225 Kio), les autres
						// sous-ensembles ne sont téléchargés qu'en cas de besoin
						"**/*-latin-{wght,300,400,500,600,700}-*.woff2"
					],
					cleanupOutdatedCaches: true,
					clientsClaim: true,
					runtimeCaching: [
						cacheTiles(
							"tiles-openstreetmap",
							/^https:\/\/[abc]\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/i
						),
						cacheTiles(
							"tiles-opentopomap",
							/^https:\/\/[abc]\.tile\.opentopomap\.org\/\d+\/\d+\/\d+\.png$/i
						),
						cacheTiles(
							"tiles-arcgis",
							/^https:\/\/server.arcgisonline.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/\d+\/\d+\/\d+$/i
						),
						// Needed to start the application: fall back to the cached copy
						// when the network is missing or too slow
						{
							urlPattern: /^https?:\/\/.*\/api\/v1\/referential\/?$/i,
							handler: "NetworkFirst",
							method: "GET",
							options: {
								cacheName: "referential",
								networkTimeoutSeconds: 5
							}
						}
					],
					disableDevLogs: true
				},
				devOptions: {
					enabled: mode === "development",
					navigateFallback: "index.html",
					suppressWarnings: true,
					type: "module"
				},
				includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
				manifest: {
					name: "Coupes rases",
					short_name: "Canopée",
					description: "Gérez vos coupes rases",
					theme_color: "#ffffff",
					background_color: "#f0e7db",
					display: "standalone",
					scope: "/",
					start_url: "/",
					orientation: "portrait",
					icons: [
						{
							src: "pwa-192x192.png",
							sizes: "192x192",
							type: "image/png"
						},
						{
							src: "pwa-512x512.png",
							sizes: "512x512",
							type: "image/png"
						}
					]
				}
			}),
			// Doit précéder react() : le plugin du routeur transforme les routes
			// avant la compilation JSX.
			tanstackRouter({ autoCodeSplitting: true }),
			react(),
			tailwindcss(),
			// Le script qu'il injecte dans la page casse le mode navigateur de
			// Vitest ; inutile hors du serveur de développement de toute façon.
			mode !== "test" && reactClickToComponent()
		] as PluginOption[]
	}
}
export default defineConfig(baseConfigFn)
