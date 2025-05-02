import "./style.css";
import type { ModMetadata } from "./type";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("No app");

app.innerHTML = `
  <div class="max-w-5xl w-full p-6 rounded-xl bg-slate-800 shadow-lg">
    <h1 class="text-3xl font-bold mb-6 text-center text-indigo-300">Modpack Comparator</h1>
    
    <div class="grid grid-cols-3 gap-4">
      <div>
        <h2 class="text-xl font-semibold mb-4 text-center">First Modpack</h2>
        <input type="file" id="jarUpload1" accept=".jar" multiple class="block w-full p-3 mb-4 text-sm text-gray-300 border border-gray-600 rounded-lg cursor-pointer bg-gray-700 focus:outline-none" />
        <button id="uploadButton1" class="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors">Upload First Pack</button>
        <div id="results1" class="mt-8 space-y-4"></div>
      </div>
      
      <div>
        <h2 class="text-xl font-semibold mb-4 text-center">Second Modpack</h2>
        <input type="file" id="jarUpload2" accept=".jar" multiple class="block w-full p-3 mb-4 text-sm text-gray-300 border border-gray-600 rounded-lg cursor-pointer bg-gray-700 focus:outline-none" />
        <button id="uploadButton2" class="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors">Upload Second Pack</button>
        <div id="results2" class="mt-8 space-y-4"></div>
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-4 text-center">Unique to First Pack</h2>
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
	const uploadButton = document.getElementById(
		`uploadButton${id}`,
	) as HTMLButtonElement;
	const resultsDiv = document.getElementById(`results${id}`) as HTMLDivElement;

	uploadButton.addEventListener("click", async () => {
		if (!jarUpload.files || jarUpload.files.length === 0) {
			alert("Please select at least one JAR file");
			return;
		}

		try {
			uploadButton.disabled = true;
			uploadButton.textContent = "Processing...";

			// Create progress elements
			const progressContainer = document.createElement("div");
			progressContainer.className = "mt-4 space-y-2";
			resultsDiv.appendChild(progressContainer); // Changed from container to resultsDiv

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
						signal: AbortSignal.timeout(120000), // 2 minutes per file
					});

					if (!response.ok)
						throw new Error(`Server returned ${response.status}`);
					results.push(await response.json());
				} catch (error) {
					console.error(`Error uploading ${file.name}:`, error);
					progress.textContent += ` - Failed: ${error instanceof Error ? error.message : "Unknown error"}`;
					progress.className += " text-red-400";
				}
			}

			displayResults(results, resultsDiv);

			// Store results for comparison
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			(state as any)[`mods${id}`] = results;

			// Compare if both packs are loaded
			if (state.mods1 && state.mods2) {
				compareMods(state.mods1, state.mods2);
			}
		} catch (error) {
			console.error("Upload failed:", error);
			alert(
				`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			uploadButton.disabled = false;
			uploadButton.textContent = `Upload Pack ${id}`;
		}
	});
};

const displayResults = (results: ModMetadata[], container: HTMLDivElement) => {
	container.innerHTML = "";

	for (const mod of results) {
		const modDiv = document.createElement("div");
		modDiv.className = "p-4 rounded-lg bg-slate-700 shadow-md";

		modDiv.innerHTML = `
      <div class="flex items-center gap-3 mb-2">
        ${mod.icon?.startsWith("data") ? `<img src="${mod.icon}" alt="${mod.name} icon" class="w-10 h-10 rounded">` : ""}
        <div class="min-w-0">
          <h3 class="text-xl font-semibold text-indigo-200 truncate">
            ${
							mod.contact?.homepage
								? `<a href="${mod.contact.homepage}" target="_blank" rel="noopener noreferrer">${mod.name}</a>`
								: mod.name
						}
          </h3>
          <div class="flex gap-2 text-sm text-gray-400 truncate">
            <span class="px-2 py-0.5 bg-indigo-900 rounded-full">v${mod.version}</span>
            <span class="truncate">by ${mod.authors[0]}</span>
          </div>
        </div>
      </div>
      <p class="text-gray-300">${mod.description}</p>
    `;

		container.appendChild(modDiv);
	}
};

setupUploader("1");
setupUploader("2");

// Add this function to compare mods
function compareMods(mods1: ModMetadata[], mods2: ModMetadata[]) {
	const comparisonDiv = document.getElementById("comparison") as HTMLDivElement;
	comparisonDiv.innerHTML = "";

	const mods2Ids = new Set(mods2.map((mod) => mod.id));
	const uniqueMods = mods1.filter((mod) => !mods2Ids.has(mod.id));

	displayResults(uniqueMods, comparisonDiv);
}
