import { useSyncExternalStore } from "react"

/**
 * Forms saved without network, waiting to be sent. The form itself stays in
 * the "clear-cut-form" storage: only the report ids and why they are still
 * waiting are kept here.
 *
 * - "offline": not sent yet, will be sent when the network is back
 * - "photos": sent, but photos taken offline are still on the device; they
 *   leave when the report is opened, then the form is sent again
 * - "conflict": refused because someone saved a newer version meanwhile;
 *   the volunteer has to open the report and choose
 */
export type PendingFormReason = "offline" | "photos" | "conflict"
export type PendingForms = Record<string, PendingFormReason>

const KEY = "pending-forms"
const CHANGED = "bcr:pending-forms-changed"
const SEND_REQUESTED = "bcr:pending-forms-send"

const EMPTY: PendingForms = {}
let cache: PendingForms | undefined

function read(): PendingForms {
	if (cache) return cache
	try {
		const parsed = JSON.parse(localStorage.getItem(KEY) ?? "{}")
		cache =
			parsed && typeof parsed === "object" && !Array.isArray(parsed)
				? (parsed as PendingForms)
				: EMPTY
	} catch {
		cache = EMPTY
	}
	return cache
}

function write(next: PendingForms) {
	cache = next
	try {
		localStorage.setItem(KEY, JSON.stringify(next))
	} catch {
		// Storage refused: the flag lives in memory until the page is closed
	}
	window.dispatchEvent(new Event(CHANGED))
}

export const getPendingForms = (): PendingForms => read()

export function setFormPending(reportId: string, reason: PendingFormReason) {
	const current = read()
	if (current[reportId] === reason) return
	write({ ...current, [reportId]: reason })
}

export function clearFormPending(reportId: string) {
	const current = read()
	if (!(reportId in current)) return
	const { [reportId]: _, ...rest } = current
	write(rest)
}

function subscribe(onChange: () => void) {
	const onStorage = (e: StorageEvent) => {
		// Another tab changed the list
		if (e.key === KEY) {
			cache = undefined
			onChange()
		}
	}
	window.addEventListener(CHANGED, onChange)
	window.addEventListener("storage", onStorage)
	return () => {
		window.removeEventListener(CHANGED, onChange)
		window.removeEventListener("storage", onStorage)
	}
}

export const usePendingForms = (): PendingForms =>
	useSyncExternalStore(subscribe, read, () => EMPTY)

/** Ask the sender (mounted once in the app) to try sending now. */
export const requestPendingFormsSend = () =>
	window.dispatchEvent(new Event(SEND_REQUESTED))

export function onPendingFormsSendRequested(listener: () => void) {
	window.addEventListener(SEND_REQUESTED, listener)
	return () => window.removeEventListener(SEND_REQUESTED, listener)
}

/** Forget the cached copy (tests clear localStorage between cases). */
export const resetPendingFormsCache = () => {
	cache = undefined
}
