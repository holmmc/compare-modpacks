import "./style.css";
import type { ModMetadata } from "./type";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("No app");

app.innerHTML = `
  <div class="upload-container">
    <h1>Modpack Comparator</h1>
    <input type="file" id="jarUpload" accept=".jar" multiple />
    <button id="uploadButton">Upload JARs</button>
    <div id="results"></div>
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
		modDiv.className = "mod-result";

		modDiv.innerHTML = `
            <div class="mod-header">
                ${mod.icon ? `<img src="${mod.icon}" alt="${mod.name} icon" class="mod-icon">` : ""}
                <h3>${mod.name} v${mod.version}</h3>
            </div>
            <p>${mod.description}</p>
            <div class="mod-details">
                <p><strong>ID:</strong> ${mod.id}</p>
                <p><strong>Authors:</strong> ${mod.authors.join(", ")}</p>
                <p><strong>License:</strong> ${mod.license}</p>
                <p><strong>Minecraft:</strong> ${mod.depends.minecraft}</p>
            </div>
        `;

		resultsDiv.appendChild(modDiv);
	}
}
