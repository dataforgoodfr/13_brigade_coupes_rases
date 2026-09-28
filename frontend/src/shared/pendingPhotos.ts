/**
 * Photos that could not be sent (no network), kept on the device in
 * IndexedDB until they can be: a photo taken in the forest must not be lost.
 */
export type PendingPhoto = {
	id: string
	reportId: string
	/** Form field the photo belongs to. */
	field: string
	file: File
	createdAt: number
}

const DB_NAME = "bcr-photos"
const STORE = "pending"

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1)
		request.onupgradeneeded = () => {
			request.result.createObjectStore(STORE, { keyPath: "id" })
		}
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

async function run<T>(
	mode: IDBTransactionMode,
	operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	const db = await openDb()
	try {
		return await new Promise<T>((resolve, reject) => {
			const transaction = db.transaction(STORE, mode)
			const request = operation(transaction.objectStore(STORE))
			transaction.oncomplete = () => resolve(request.result)
			transaction.onerror = () => reject(transaction.error)
			transaction.onabort = () => reject(transaction.error)
		})
	} finally {
		db.close()
	}
}

let lastCreatedAt = 0

export async function addPendingPhoto(
	photo: Omit<PendingPhoto, "id" | "createdAt">
): Promise<PendingPhoto> {
	// Strictly increasing, so photos taken in the same millisecond keep their order
	lastCreatedAt = Math.max(Date.now(), lastCreatedAt + 1)
	const pending = {
		...photo,
		id: crypto.randomUUID(),
		createdAt: lastCreatedAt
	}
	await run("readwrite", (store) => store.put(pending))
	return pending
}

export async function listPendingPhotos(
	reportId: string,
	field: string
): Promise<PendingPhoto[]> {
	const all = await run<PendingPhoto[]>("readonly", (store) => store.getAll())
	return all
		.filter((photo) => photo.reportId === reportId && photo.field === field)
		.sort((a, b) => a.createdAt - b.createdAt)
}

export async function removePendingPhoto(id: string): Promise<void> {
	await run("readwrite", (store) => store.delete(id))
}
