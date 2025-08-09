/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API: string;
	readonly VITE_CI: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
