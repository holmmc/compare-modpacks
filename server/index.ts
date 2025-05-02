import { handleJarUpload } from "./api/uploadHandler";

const server = Bun.serve({
	port: process.env.PORT || 3000,
	routes: {
		"/": async () => new Response(Bun.file("./dist/index.html")),
		"/api/upload-jar": {
			POST: handleJarUpload,
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

console.log(`\x1b[32mServer running at http://localhost:${server.port}\x1b[0m`);
