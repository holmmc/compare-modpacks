export interface ModMetadata {
	schemaVersion: number;
	id: string;
	version: string;
	name: string;
	description: string;
	authors: string[];
	icon: string;
	contact: {
		homepage: string;
		sources: string;
		issues: string;
	};
	license: string;
	environment: string;
	entrypoints: {
		main: string[];
	};
	mixins: string[];
	depends: {
		fabricloader: string;
		fabric: string;
		minecraft: string;
		java: string;
		origins: string;
	};
}
