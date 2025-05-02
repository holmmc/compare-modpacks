import { rm } from "node:fs/promises";
import { createZipReader } from "@holmlibs/unzip";

export async function handleJarUpload(req: Request): Promise<Response> {
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
		return new Response("File processing failed", { status: 500 });
	} finally {
		rm(tempDir, { recursive: true, force: true });
	}
}

async function processJarFile(jarPath: string) {
	try {
		const reader = createZipReader(jarPath);
		const fileRaw = await reader.getEntry("fabric.mod.json")?.getText();
		if (!fileRaw) throw new Error("No fabric.mod.json found in the JAR file");

		const fabricData = JSON.parse(fileRaw);

		if (fabricData.icon) {
			const iconEntry = reader.getEntry(fabricData.icon);
			if (iconEntry) {
				const iconBuffer = await iconEntry.getBuffer();
				const mimeType = fabricData.icon.endsWith(".png")
					? "image/png"
					: fabricData.icon.endsWith(".jpg")
						? "image/jpeg"
						: fabricData.icon.endsWith(".gif")
							? "image/gif"
							: "application/octet-stream";
				fabricData.icon = `data:${mimeType};base64,${iconBuffer.toString("base64")}`;
			}
		}

		return fabricData;
	} catch (error) {
		console.error(
			`Failed to extract mod metadata: ${error instanceof Error ? error.message : String(error)}`,
		);
		return undefined;
	}
}
