import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	base: "/compare-modpacks/",
	plugins: [
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Modpack Comparator",
				short_name: "ModCompare",
				theme_color: "#0f172a",
				icons: [
					{
						src: "/compare-modpacks/icons/icon-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "/compare-modpacks/icons/icon-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
				],
			},
		}),
	],
	build: {
		outDir: "docs",
		modulePreload: {
			polyfill: false,
		},
	},
});
