/// <reference types="vitest" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
	return {
		test: {
			css: true,
			environment: "jsdom",
			setupFiles: ["src/test/setup.ts"],
			testTimeout: 60_000,
		},
		preview: {
			port: 8000	
		},
		plugins: [
			VitePWA({
				registerType: "prompt",
				injectRegister: false,
				workbox: {
					globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
					cleanupOutdatedCaches: true,
					clientsClaim: true,
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
			TanStackRouterVite({ autoCodeSplitting: true }),
		],
	};
});
