/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API: string;
	readonly VITE_USE_MOCKS?: boolean;
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
