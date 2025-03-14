/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API: string;
	readonly VITE_MOCK: "false" | "true";
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
