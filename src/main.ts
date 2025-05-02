import "./style.css";
import type { ModMetadata } from "./type";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("No app");

app.innerHTML = /*html*/ `
	<div class="fixed flex top-0 left-0 flex-col z-[40] w-full !max-w-full items-center justify-center bg-transparent transition-bg overflow-hidden h-[60vh] -top-16 pointer-events-none opacity-[.35] dark:opacity-50">
		<div class="jumbo absolute opacity-60 -animate"></div>
	</div>
	<div class="max-w-5xl w-full p-6 rounded-xl bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 transition-all">
		<h1 class="text-3xl font-bold mb-6 text-center text-white/90 drop-shadow-md">Modpack Comparator</h1>

		<div class="grid grid-cols-3 gap-4">
			<div>
				<h2 class="text-xl font-semibold mb-4 text-center text-white/80">First Modpack</h2>
				<input type="file" id="jarUpload1" accept=".jar" multiple class="block w-full p-3 mb-4 text-sm text-white/80 border border-white/20 rounded-lg cursor-pointer bg-white/5 backdrop-blur-md hover:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" />
				<div id="results1" class="mt-8 space-y-4"></div>
			</div>

			<div>
				<h2 class="text-xl font-semibold mb-4 text-center text-white/80">Second Modpack</h2>
				<input type="file" id="jarUpload2" accept=".jar" multiple class="block w-full p-3 mb-4 text-sm text-white/80 border border-white/20 rounded-lg cursor-pointer bg-white/5 backdrop-blur-md hover:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" />
				<div id="results2" class="mt-8 space-y-4"></div>
			</div>

			<div>
				<h2 class="text-xl font-semibold mb-4 text-center text-white/80">Unique to First Pack</h2>
				<input type="input" id="compared_count" disabled class="block w-full p-3 mb-4 text-sm text-white/80 border border-white/20 rounded-lg bg-white/5 backdrop-blur-md focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" />
				<div id="comparison" class="mt-8 space-y-4"></div>
			</div>
		</div>
	</div>
`;

const state = {
	mods1: [],
	mods2: [],
};

// Setup uploaders and results for both modpacks
const setupUploader = (id: string) => {
	const jarUpload = document.getElementById(
		`jarUpload${id}`,
	) as HTMLInputElement;
	const resultsDiv = document.getElementById(`results${id}`) as HTMLDivElement;

	jarUpload.addEventListener("change", async () => {
		if (!jarUpload.files || jarUpload.files.length === 0) return;

		// Create progress elements
		const progressContainer = document.createElement("div");
		progressContainer.className = "mt-4 space-y-2";
		resultsDiv.innerHTML = "";
		resultsDiv.appendChild(progressContainer);

		const results = [];
		const files = Array.from(jarUpload.files);

		// Process files sequentially
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const progress = document.createElement("div");
			progress.className = "text-sm text-gray-400";
			progress.textContent = `Uploading ${file.name} (${i + 1}/${files.length})`;
			progressContainer.appendChild(progress);

			const formData = new FormData();
			formData.append("jarFile", file);

			try {
				const response = await fetch("/api/upload-jar", {
					method: "POST",
					body: formData,
					signal: AbortSignal.timeout(120000),
				});

				if (!response.ok) throw new Error(`Server returned ${response.status}`);
				results.push(await response.json());
			} catch (error) {
				console.error(`Error uploading ${file.name}:`, error);
				progress.textContent += ` - Failed: ${error instanceof Error ? error.message : "Unknown error"}`;
				progress.className += " text-red-400";
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
			"card p-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/15 hover:shadow-white/5 hover:-translate-y-0.5 transition-all";

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

// Add this function to compare mods
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
