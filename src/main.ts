import "./style.css";
import type { ModMetadata } from "./type";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("No app");

app.innerHTML = `
  <div class="max-w-3xl w-full p-6 rounded-xl bg-slate-800 shadow-lg">
    <h1 class="text-3xl font-bold mb-6 text-center text-indigo-300">Modpack Comparator</h1>
    <input type="file" id="jarUpload" accept=".jar" multiple class="block w-full p-3 mb-4 text-sm text-gray-300 border border-gray-600 rounded-lg cursor-pointer bg-gray-700 focus:outline-none" />
    <button id="uploadButton" class="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors">Upload JARs</button>
    <div id="results" class="mt-8 space-y-4"></div>
  </div>
`;

const jarUpload = document.getElementById("jarUpload") as HTMLInputElement;
const uploadButton = document.getElementById(
	"uploadButton",
) as HTMLButtonElement;
const resultsDiv = document.getElementById("results") as HTMLDivElement;

uploadButton.addEventListener("click", async () => {
	if (!jarUpload.files || jarUpload.files.length === 0) {
		alert("Please select at least one JAR file");
		return;
	}

	const formData = new FormData();
	for (const file of Array.from(jarUpload.files)) {
		formData.append("jarFiles", file);
	}

	try {
		uploadButton.disabled = true;
		uploadButton.textContent = "Processing...";

		const response = await fetch("/api/upload-jars", {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`Server returned ${response.status}`);
		}

		const results = await response.json();
		displayResults(results);
	} catch (error) {
		console.error("Upload failed:", error);
		alert(
			`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	} finally {
		uploadButton.disabled = false;
		uploadButton.textContent = "Upload JARs";
	}
});

function displayResults(results: ModMetadata[]) {
	resultsDiv.innerHTML = "";

	for (const mod of results) {
		const modDiv = document.createElement("div");
		modDiv.className = "p-4 rounded-lg bg-slate-700 shadow-md";

		modDiv.innerHTML = `
            <div class="flex items-center gap-3 mb-2">
                ${mod.icon ? `<img src="${mod.icon}" alt="${mod.name} icon" class="w-10 h-10 rounded">` : ""}
                <div>
                    <h3 class="text-xl font-semibold text-indigo-200">${mod.name}</h3>
                    <div class="flex gap-2 text-sm text-gray-400">
                        <span class="px-2 py-0.5 bg-indigo-900 rounded-full">v${mod.version}</span>
                        <span>by ${mod.authors.join(", ")}</span>
                    </div>
                </div>
            </div>
            <p class="text-gray-300">${mod.description}</p>
        `;

		resultsDiv.appendChild(modDiv);
	}
}
