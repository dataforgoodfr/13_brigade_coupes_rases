import { isUndefined } from "es-toolkit"
import z from "zod"

export const localStorageRepository = <Value>(key: string) => ({
	setToLocalStorage: (value?: Value) => setToLocalStorage(key, value),
	getFromLocalStorage: (schema: z.ZodType<Value>) =>
		getFromLocalStorage(key, schema),
	getFromLocalStorageOrDefault: (
		schema: z.ZodType<Value>,
		defaultValue: Value
	) => getFromLocalStorageOrDefault(key, schema, defaultValue),
	setToLocalStorageById: (id: string, value?: Value) =>
		setToLocalStorageById(key, id, value),
	getFromLocalStorageById: (id: string, schema: z.ZodType<Value>) =>
		getFromLocalStorageById(key, id, schema),
	getFromLocalStorageOrDefaultById: (
		id: string,
		schema: z.ZodType<Value>,
		defaultValue: Value
	) => getFromLocalStorageOrDefaultById(key, id, schema, defaultValue),
	pruneStorage: (
		keep: (id: string, value: Value) => boolean,
		schema: z.ZodType<Value>
	) => pruneStorage(key, keep, schema),
	getRecordFromStorage: (schema: z.ZodType<Value>) =>
		getRecordFromStorage(key, schema),
	getValuesFromStorage: (schema: z.ZodType<Value>) =>
		getValuesFromStorage(key, schema)
})
function setToLocalStorage<Value>(key: string, value?: Value) {
	if (!isUndefined(value)) {
		localStorage.setItem(key, JSON.stringify(value))
	} else {
		localStorage.removeItem(key)
	}
}
function getFromLocalStorage<Value>(
	key: string,
	schema: z.ZodType<Value>
): Value | undefined {
	const item = localStorage.getItem(key)
	try {
		if (item !== null) {
			return schema.parse(JSON.parse(item))
		}
	} catch (_e) {
		console.error("Failed to parse localStorage item", key, item)
		localStorage.removeItem(key)
	}
}

function getFromLocalStorageOrDefault<Value>(
	key: string,
	schema: z.ZodType<Value>,
	defaultValue: Value
): Value {
	return getFromLocalStorage(key, schema) ?? defaultValue
}

function setToLocalStorageById<Value>(key: string, id: string, value?: Value) {
	const items = getFromLocalStorageOrDefault(
		key,
		z.record(z.string(), z.unknown()),
		{}
	)
	items[id] = value
	localStorage.setItem(key, JSON.stringify(items))
}

function getFromLocalStorageById<Value>(
	key: string,
	id: string,
	schema: z.ZodType<Value>
): Value | undefined {
	const record = getRecordFromStorage(key, schema)
	return record[id]
}

function getFromLocalStorageOrDefaultById<Value>(
	key: string,
	id: string,
	schema: z.ZodType<Value>,
	defaultValue: Value
): Value {
	return getFromLocalStorageById(key, id, schema) ?? defaultValue
}

/**
 * Entries are validated one by one: an entry written by an older version of
 * the application is skipped, without discarding the others.
 */
function getRecordFromStorage<Value>(
	key: string,
	schema: z.ZodType<Value>
): Record<string, Value> {
	const raw = getFromLocalStorage(key, z.record(z.string(), z.unknown())) ?? {}
	const record: Record<string, Value> = {}
	for (const [id, value] of Object.entries(raw)) {
		const parsed = schema.safeParse(value)
		if (parsed.success) {
			record[id] = parsed.data
		} else {
			console.warn("Ignoring invalid localStorage entry", key, id)
		}
	}
	return record
}
function getValuesFromStorage<Value>(
	key: string,
	schema: z.ZodType<Value>
): Value[] {
	return Object.values(getRecordFromStorage(key, schema))
}
/**
 * Removes the valid entries for which `keep` returns false. Entries that do
 * not match the schema are left untouched: they may hold unsent work.
 */
function pruneStorage<Value>(
	key: string,
	keep: (id: string, value: Value) => boolean,
	schema: z.ZodType<Value>
) {
	const raw = getFromLocalStorage(key, z.record(z.string(), z.unknown()))
	if (isUndefined(raw)) return
	const kept = Object.fromEntries(
		Object.entries(raw).filter(([id, value]) => {
			const parsed = schema.safeParse(value)
			return !parsed.success || keep(id, parsed.data)
		})
	)
	setToLocalStorage(key, kept)
}

export type LocalStorageRepository<Value> = ReturnType<
	typeof localStorageRepository<Value>
>
