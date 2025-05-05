interface HTMLDirReader extends HTMLDivElement {
	files: File[];
}

interface DirReaderOptions {
	defaultLocation?:
		| FileSystemHandle
		| "desktop"
		| "documents"
		| "downloads"
		| "music"
		| "pictures"
		| "videos";
	fileExtensionFilter?: string;
	subfolderName?: string;
}

const HTML = `
<div class="file-input flex justify-between w-full p-1 mb-4 text-sm text-white/80 border border-white/20 rounded-lg cursor-pointer bg-white/5 backdrop-blur-md hover:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" tabindex="0" role="button">
    <p class="flex items-center h-9">Choose Folder</p>
    <span>
        <button data-action="select" class="hidden">Browse</button>
        <button data-action="refresh" class="hidden h-9 aspect-square text-white/80 hover:text-white/90 transition-colors cursor-pointer">⟳</button>
    </span>
</div>
`;

export default function DirReader(options?: DirReaderOptions) {
	const fileInputWrapper = new DOMParser().parseFromString(HTML, "text/html")
		.body.firstChild as HTMLDirReader;
	const folderLabel = fileInputWrapper.querySelector(
		"p",
	) as HTMLParagraphElement;
	const browseButton = fileInputWrapper.querySelector(
		'button[data-action="select"]',
	) as HTMLButtonElement;
	const refreshButton = fileInputWrapper.querySelector(
		'button[data-action="refresh"]',
	) as HTMLButtonElement;

	let dirHandle: FileSystemDirectoryHandle;

	browseButton.onclick = () => {
		const pickerOptions = options?.defaultLocation
			? { startIn: options.defaultLocation }
			: undefined;
		browseDir(window.showDirectoryPicker(pickerOptions));
	};

	refreshButton.onclick = updateFiles;

	fileInputWrapper.onclick = (e) => {
		if ((e.target as HTMLElement).tagName === "BUTTON") return;
		browseButton.click();
	};

	fileInputWrapper.ondragover = (e) => {
		e.preventDefault();
		fileInputWrapper.classList.add("dragover");
	};

	fileInputWrapper.ondragleave = () => {
		fileInputWrapper.classList.remove("dragover");
	};

	fileInputWrapper.ondrop = async (e) => {
		e.preventDefault();
		fileInputWrapper.classList.remove("dragover");
		if (!e.dataTransfer) return;
		const item = e.dataTransfer.items[0];
		if (item.kind !== "file" || !item.webkitGetAsEntry()?.isDirectory) return;
		browseDir(
			item.getAsFileSystemHandle() as Promise<FileSystemDirectoryHandle>,
		);
	};

	async function browseDir(dir: Promise<FileSystemDirectoryHandle>) {
		try {
			dirHandle = await dir;
			try {
				if (options?.subfolderName)
					dirHandle = await dirHandle.getDirectoryHandle(options.subfolderName);
			} catch {}
			updateFiles();
		} catch (err) {
			console.error("Error:", err);
		}
	}

	async function updateFiles() {
		if (!dirHandle) return;
		const files = await getFiles();
		let title = "";
		for (let i = 0; i < Math.min(files.length, 32); i++) {
			const { name } = files[i];
			title += `${name}\n`;
		}
		folderLabel.title = title;
		folderLabel.textContent = `${files.length} files selected`;
		fileInputWrapper.files = files;
		refreshButton.classList.remove("hidden");
		fileInputWrapper.dispatchEvent(
			new CustomEvent("change", { detail: { files } }),
		);
	}

	async function getFiles() {
		const fileListPromises = [];
		for await (const entry of dirHandle.values()) {
			if (entry.kind !== "file") continue;
			if (
				options?.fileExtensionFilter &&
				!entry.name.endsWith(options.fileExtensionFilter)
			)
				continue;

			fileListPromises.push(
				dirHandle.getFileHandle(entry.name).then((handle) => handle.getFile()),
			);
		}
		const fileList = await Promise.all(fileListPromises);
		return fileList.sort((a, b) => a.name.localeCompare(b.name));
	}

	return fileInputWrapper;
}
