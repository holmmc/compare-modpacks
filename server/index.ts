import { rm } from "node:fs/promises";
import { processJarFile } from "./api/jarProcessor";

const server = Bun.serve({
	port: process.env.PORT || 3000,
	routes: {
		"/": async () => new Response(Bun.file("./dist/index.html")),
		"/api/upload-jar": {
			POST: async (req) => {
				const jarFile = (await req.formData()).get("jarFile") as Blob;
				if (!jarFile) return new Response("No file", { status: 400 });

				const tempDir = `./temp/${Date.now()}`;
				const jarPath = `${tempDir}/uploaded.jar`;

				try {
					await Bun.write(jarPath, jarFile);
					return new Response(JSON.stringify(await processJarFile(jarPath)), {
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
		const assetPath = `./dist${url.pathname}`;
		return (await Bun.file(assetPath).exists())
			? new Response(Bun.file(assetPath))
			: new Response("Not Found", { status: 404 });
	},
	error() {
		return new Response("Internal Server Error", { status: 500 });
	},
});

console.log(`Server running at http://localhost:${server.port}`);
