import { file } from "bun";
import { processJarFile } from "./api/jarProcessor";

const server = Bun.serve({
	port: process.env.PORT || 3000,
	async fetch(req) {
		const url = new URL(req.url);

		// Serve static files from dist directory
		if (url.pathname === "/") {
			const filePath = "./dist/index.html";
			const fileExists = await file(filePath).exists();
			if (!fileExists) {
				return new Response("Not Found", { status: 404 });
			}
			return new Response(file(filePath));
		}

		if (url.pathname === "/api/upload-jar" && req.method === "POST") {
			const formData = await req.formData();
			const jarFile = formData.get("jarFile") as Blob;
			if (!jarFile) return new Response("No file", { status: 400 });

			const tempDir = `./temp/${Date.now()}`;
			await Bun.write(`${tempDir}/.temp`, "");
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
				try {
					Bun.spawn(["del", "/f", "/q", jarPath]);
					Bun.spawn(["rmdir", "/s", "/q", tempDir]);
				} catch (cleanupError) {
					console.error("Cleanup failed:", cleanupError);
				}
			}
		}

		// Serve other static assets
		const assetPath = `./dist${url.pathname}`;
		const assetExists = await file(assetPath).exists();
		if (assetExists) {
			return new Response(file(assetPath));
		}

		return new Response("Not Found", { status: 404 });
	},
	error() {
		return new Response("Internal Server Error", { status: 500 });
	},
});

console.log(`Server running at http://localhost:${server.port}`);
