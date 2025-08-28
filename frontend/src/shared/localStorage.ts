import { isUndefined } from "es-toolkit";
import z from "zod";

export const localStorageRepository = <Value>(key: string) => ({
	setToLocalStorage: (value?: Value) => setToLocalStorage(key, value),
	getFromLocalStorage: (schema: z.ZodType<Value>) =>
		getFromLocalStorage(key, schema),
	getFromLocalStorageOrDefault: (
		schema: z.ZodType<Value>,
		defaultValue: Value,
	) => getFromLocalStorageOrDefault(key, schema, defaultValue),
	setToLocalStorageById: (id: string, value?: Value) =>
		setToLocalStorageById(key, id, value),
	getFromLocalStorageById: (id: string, schema: z.ZodType<Value>) =>
		getFromLocalStorageById(key, id, schema),
	getFromLocalStorageOrDefaultById: (
		id: string,
		schema: z.ZodType<Value>,
		defaultValue: Value,
	) => getFromLocalStorageOrDefaultById(key, id, schema, defaultValue),
	syncStorage: (ids: string[], schema: z.ZodType<Value>) =>
		syncStorage(key, ids, schema),
	getRecordFromStorage: (schema: z.ZodType<Value>) =>
		getRecordFromStorage(key, schema),
	getValuesFromStorage: (schema: z.ZodType<Value>) =>
		getValuesFromStorage(key, schema),
});
function setToLocalStorage<Value>(key: string, value?: Value) {
	if (!isUndefined(value)) {
		localStorage.setItem(key, JSON.stringify(value));
	} else {
		localStorage.removeItem(key);
	}
}
function getFromLocalStorage<Value>(
	key: string,
	schema: z.ZodType<Value>,
): Value | undefined {
	const item = localStorage.getItem(key);
	if (item !== null) {
		return schema.parse(JSON.parse(item));
	}
}

function getFromLocalStorageOrDefault<Value>(
	key: string,
	schema: z.ZodType<Value>,
	defaultValue: Value,
): Value {
	return getFromLocalStorage(key, schema) ?? defaultValue;
}

function setToLocalStorageById<Value>(key: string, id: string, value?: Value) {
	const items = getFromLocalStorageOrDefault(
		key,
		z.record(z.string(), z.unknown()),
		{},
	);
	items[id] = value;
	localStorage.setItem(key, JSON.stringify(items));
}

function getFromLocalStorageById<Value>(
	key: string,
	id: string,
	schema: z.ZodType<Value>,
): Value | undefined {
	return getRecordFromStorage(key, schema)[id];
}

function getFromLocalStorageOrDefaultById<Value>(
	key: string,
	id: string,
	schema: z.ZodType<Value>,
	defaultValue: Value,
): Value {
	return getFromLocalStorageById(key, id, schema) ?? defaultValue;
}

function getRecordFromStorage<Value>(
	key: string,
	schema: z.ZodType<Value>,
): Record<string, Value> {
	const entry = localStorage.getItem(key);
	if (entry !== null) {
		return z.record(z.string(), schema).parse(JSON.parse(entry));
	}
	return {};
}
function getValuesFromStorage<Value>(
	key: string,
	schema: z.ZodType<Value>,
): Value[] {
	return Object.values(getRecordFromStorage(key, schema));
}
function syncStorage<Value>(
	key: string,
	ids: string[],
	schema: z.ZodType<Value>,
) {
	const record = getRecordFromStorage(key, schema);
	const withIds = Object.fromEntries(
		Object.entries(record).filter(([id]) => ids.includes(id)),
	);
	setToLocalStorage(key, withIds);
}

export type LocalStorageRepository<Value> = ReturnType<
	typeof localStorageRepository<Value>
>;
