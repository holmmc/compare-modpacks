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

		// Handle multiple JAR file uploads
		if (url.pathname === "/api/upload-jars" && req.method === "POST") {
			const formData = await req.formData();
			const jarFiles = formData.getAll("jarFiles") as Blob[];
			if (!jarFiles.length) return new Response("No files", { status: 400 });

			const tempDir = `./out/${Date.now()}`;
			await Bun.write(`${tempDir}/.temp`, "");

			const results = await Promise.all(
				jarFiles.map(async (jarFile, index) => {
					const jarPath = `${tempDir}/uploaded_${index}.jar`;
					await Bun.write(jarPath, jarFile);
					return processJarFile(jarPath).catch((e) => ({ error: e.message }));
				}),
			);

			await Bun.spawn({ cmd: ["rm", "-rf", tempDir] }).exited;

			return new Response(JSON.stringify(results), {
				headers: { "Content-Type": "application/json" },
			});
		}

		// Serve other static assets
		const assetPath = `./dist${url.pathname}`;
		const assetExists = await file(assetPath).exists();
		if (assetExists) {
			return new Response(file(assetPath));
		}

		return new Response("Not Found", { status: 404 });
	},
	error(error) {
		return new Response("Internal Server Error", { status: 500 });
	},
});

console.log(`Server running at http://localhost:${server.port}`);
