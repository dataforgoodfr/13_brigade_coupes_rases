import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState
} from "react"

type UploadingContextValue = {
	/** True while at least one image field is uploading. */
	isUploading: boolean
	/** Register/unregister an upload in progress for a given field id. */
	setFieldUploading: (id: string, uploading: boolean) => void
}

const UploadingContext = createContext<UploadingContextValue>({
	isUploading: false,
	setFieldUploading: () => {}
})

/**
 * Tracks how many image fields are currently uploading so that ancestors
 * (e.g. the "Sauvegarder" button) can react to in-flight uploads and avoid
 * saving the form with an incomplete set of photos.
 */
export function UploadingProvider({ children }: { children: ReactNode }) {
	const [uploadingCount, setUploadingCount] = useState(0)
	const idsRef = useRef<Set<string>>(new Set())

	const setFieldUploading = useCallback((id: string, uploading: boolean) => {
		const ids = idsRef.current
		const wasUploading = ids.has(id)
		if (uploading && !wasUploading) {
			ids.add(id)
			setUploadingCount(ids.size)
		} else if (!uploading && wasUploading) {
			ids.delete(id)
			setUploadingCount(ids.size)
		}
	}, [])

	const value = useMemo(
		() => ({ isUploading: uploadingCount > 0, setFieldUploading }),
		[uploadingCount, setFieldUploading]
	)

	return (
		<UploadingContext.Provider value={value}>
			{children}
		</UploadingContext.Provider>
	)
}

export function useUploadingTracker() {
	return useContext(UploadingContext)
}
