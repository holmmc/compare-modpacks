import { rm } from "node:fs/promises";
import { processJarFile } from "./api/jarProcessor";

const server = Bun.serve({
	port: process.env.PORT || 3000,
	routes: {
		"/": async () => new Response(Bun.file("./dist/index.html")),
		"/api/upload-jar": {
			POST: async (req) => {
				const formData = await req.formData();
				const jarFile = formData.get("jarFile") as Blob;
				if (!jarFile) return new Response("No file", { status: 400 });

				const tempDir = `./temp/${Date.now()}`;
				const jarPath = `${tempDir}/uploaded.jar`;

				try {
					await Bun.write(jarPath, jarFile);
					const result = await processJarFile(jarPath);

					return new Response(JSON.stringify(result), {
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("File processing failed:", error);
					return new Response("File processing failed", { status: 500 });
				} finally {
					rm(tempDir, { recursive: true, force: true });
				}
			},
		},
	},
	async fetch(req) {
		const url = new URL(req.url);

		// Serve other static assets
		const assetPath = `./dist${url.pathname}`;
		const assetExists = await Bun.file(assetPath).exists();
		if (assetExists) {
			return new Response(Bun.file(assetPath));
		}

		return new Response("Not Found", { status: 404 });
	},
	error() {
		return new Response("Internal Server Error", { status: 500 });
	},
});

console.log(`Server running at http://localhost:${server.port}`);
