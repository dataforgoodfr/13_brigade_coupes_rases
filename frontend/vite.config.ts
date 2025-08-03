import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, type PluginOption, type UserConfigFnObject } from "vite";
import { VitePWA, type VitePWAOptions } from "vite-plugin-pwa";
import { reactClickToComponent } from "vite-plugin-react-click-to-component";
import tsconfigPaths from "vite-tsconfig-paths";

type RuntimeCaching = NonNullable<
	VitePWAOptions["workbox"]["runtimeCaching"]
>[number];
function cacheNetworkFirst(
	urlPattern: RuntimeCaching["urlPattern"],
): RuntimeCaching {
	return { urlPattern, handler: "NetworkFirst", method: "GET" };
}
export const baseConfigFn: UserConfigFnObject = ({ mode }) => {
	return {
		preview: {
			port: 8000,
		},
		plugins: [
			VitePWA({
				registerType: "prompt",
				injectRegister: false,
				workbox: {
					globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
					cleanupOutdatedCaches: true,
					clientsClaim: true,
					runtimeCaching: [
						cacheNetworkFirst(
							/^https:\/\/[abc]\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/i,
						),
						cacheNetworkFirst(
							/^https:\/\/[abc]\.tile\.opentopomap\.org\/\d+\/\d+\/\d+\.png$/i,
						),
						cacheNetworkFirst(
							/^https:\/\/server.arcgisonline.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/\d+\/\d+\/\d+$/i,
						),
						cacheNetworkFirst(/^https:\/\/.*\/api\/v1\/referential$/i),
					],
				},
				devOptions: {
					enabled: mode === "development",
					navigateFallback: "index.html",
					suppressWarnings: true,
					type: "module",
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
							type: "image/png",
						},
						{
							src: "pwa-512x512.png",
							sizes: "512x512",
							type: "image/png",
						},
					],
				},
			}),
			react(),
			tailwindcss(),
			tsconfigPaths(),
			reactClickToComponent(),
			tanstackRouter({ autoCodeSplitting: true }),
		] as PluginOption[],
	};
};
export default defineConfig(baseConfigFn);
