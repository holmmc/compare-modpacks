import { loadAsync } from "jszip";
import "./style.css";
import type { ModMetadata } from "./type";

const state = {
	mods1: [],
	mods2: [],
};

const setupUploader = (id: string) => {
	const jarUpload = document.getElementById(
		`jarUpload${id}`,
	) as HTMLInputElement;
	const resultsDiv = document.getElementById(`results${id}`) as HTMLDivElement;

	jarUpload.addEventListener("change", async () => {
		if (!jarUpload.files || jarUpload.files.length === 0) return;

		resultsDiv.innerHTML = "";
		const results = [];
		const files = Array.from(jarUpload.files);
		const progress = document.createElement("div");
		progress.className = "text-sm text-gray-400 mt-4";
		resultsDiv.appendChild(progress);

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			progress.textContent = `Processing (${i + 1}/${files.length})`;

			try {
				const zipContent = await loadAsync(file);
				const fabricJsonFile = zipContent.file("fabric.mod.json");
				if (!fabricJsonFile) throw new Error("No fabric.mod.json found");
				const fabricJson = await fabricJsonFile.async("text");
				const modData = JSON.parse(fabricJson) as ModMetadata;

				// Handle icon if it exists in the mod
				if (modData.icon) {
					const iconFile = zipContent.file(modData.icon);
					if (iconFile) {
						const iconData = await iconFile.async("uint8array");
						const mimeType = modData.icon.endsWith(".png")
							? "image/png"
							: modData.icon.endsWith(".jpg")
								? "image/jpeg"
								: "image/webp";
						const base64 = btoa(String.fromCharCode(...iconData));
						modData.icon = `data:${mimeType};base64,${base64}`;
					}
				}
				results.push(modData);
			} catch (error) {
				console.error(`Error processing ${file.name}:`, error);
			}
		}

		displayResults(results, resultsDiv);
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		(state as any)[`mods${id}`] = results;
		if (state.mods1 && state.mods2) compareMods(state.mods1, state.mods2);
	});
};

const displayResults = (results: ModMetadata[], container: HTMLDivElement) => {
	container.innerHTML = "";

	for (const mod of results) {
		const modDiv = document.createElement("div");
		modDiv.className =
			"card p-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/15 hover:shadow-white/5 transition-all";

		modDiv.innerHTML = `
      <div class="flex items-center gap-3 mb-2">
        ${mod.icon?.startsWith("data") ? `<img src="${mod.icon}" alt="${mod.name} icon" class="w-10 h-10 rounded shadow-md">` : ""}
        <div class="min-w-0">
          <h3 class="text-xl font-semibold text-white/90 drop-shadow-sm truncate">
            ${
							mod.contact?.homepage
								? `<a href="${mod.contact.homepage}" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">${mod.name}</a>`
								: mod.name
						}
          </h3>
          <div class="flex gap-2 text-sm text-white/70 truncate">
            <span class="px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full shadow-inner">${mod.version}</span>
            <span class="truncate">by ${mod.authors[0]}</span>
          </div>
        </div>
      </div>
      <p class="text-white/80">${mod.description}</p>
    `;

		container.appendChild(modDiv);
	}
};

setupUploader("1");
setupUploader("2");

function compareMods(mods1: ModMetadata[], mods2: ModMetadata[]) {
	const comparisonDiv = document.getElementById("comparison") as HTMLDivElement;
	const countInput = document.getElementById(
		"compared_count",
	) as HTMLInputElement;
	comparisonDiv.innerHTML = "";

	const mods2Ids = new Set(mods2.map((mod) => mod.id));
	const uniqueMods = mods1.filter((mod) => !mods2Ids.has(mod.id));

	countInput.value = `${uniqueMods.length} unique mods`;
	displayResults(uniqueMods, comparisonDiv);
}

document.getElementById("swapMods")?.addEventListener("click", () => {
	// Swap mod arrays
	[state.mods1, state.mods2] = [state.mods2, state.mods1];

	// Swap file input values
	const jarUpload1 = document.getElementById("jarUpload1") as HTMLInputElement;
	const jarUpload2 = document.getElementById("jarUpload2") as HTMLInputElement;
	[jarUpload1.files, jarUpload2.files] = [jarUpload2.files, jarUpload1.files];

	// Update displays
	const results1 = document.getElementById("results1") as HTMLDivElement;
	const results2 = document.getElementById("results2") as HTMLDivElement;

	displayResults(state.mods1, results1);
	displayResults(state.mods2, results2);

	// Update comparison if both modpacks are loaded
	if (state.mods1.length && state.mods2.length) {
		compareMods(state.mods1, state.mods2);
	}
});
