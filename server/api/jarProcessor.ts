import { createZipReader } from "@holmlibs/unzip";

export async function processJarFile(jarPath: string) {
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

// (async () => {
// 	const data = await extractModMetadata(
// 		"E:/Users/Nicat/AppData/Roaming/ModrinthApp/profiles/TEST/mods/AltOriginGui-fabric-1.20.1-1.1.1.jar",
// 	);

// 	console.log(data);
// })();
