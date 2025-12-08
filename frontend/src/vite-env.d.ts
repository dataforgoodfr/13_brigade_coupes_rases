/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API: string
	readonly VITE_CI: string
	readonly VITE_USE_RELOAD_PWA_PATH: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
