import { configureStore, createSlice } from "@reduxjs/toolkit"
import { HTTPError } from "ky"
import { beforeEach, describe, expect, it } from "vitest"
import z from "zod"

import type { RequestedContent } from "@/shared/api/types"
import { localStorageRepository } from "@/shared/localStorage"
import type { AppDispatch } from "@/shared/store/store"
import {
	addRequestedContentCases,
	createAppAsyncThunk,
	isUnauthorizedRejection,
	withEntityStorageActionCreator,
	withStorageActionCreator
} from "@/shared/store/thunk"

const valueSchema = z.object({ name: z.string() })
type Value = z.infer<typeof valueSchema>
const errorSchema = z.object({ code: z.string() })
type ApiError = z.infer<typeof errorSchema>

// Une API factice à la place de ky : `fail` pilote l'issue de l'appel.
let fail: unknown
const fetchValue = createAppAsyncThunk<Value>("test/fetch", async () => {
	if (fail !== undefined) throw fail
	return { name: "from api" }
})

// ky 2 reads the body of a refused response into `data` before throwing
function httpError(status: number, data: unknown) {
	const request = new Request("http://api.test/")
	const error = new HTTPError(
		new Response(null, { status }),
		request,
		{} as ConstructorParameters<typeof HTTPError>[2]
	)
	error.data = data
	return error
}

const storage = localStorageRepository<Value>("thunk-test")
const fetchWithFallback = createAppAsyncThunk<Value>(
	"test/fetchWithFallback",
	withStorageActionCreator(
		async () => {
			if (fail !== undefined) throw fail
			return { name: "from api" }
		},
		{ schema: valueSchema, type: "controlled", storage }
	)
)
const fetchEntity = createAppAsyncThunk<Value, { id: string }>(
	"test/fetchEntity",
	withEntityStorageActionCreator(
		async ({ id }) => {
			if (fail !== undefined) throw fail
			return { name: `entity ${id}` }
		},
		{
			schema: valueSchema,
			type: "uncontrolled",
			key: "entity-test",
			getId: (v) => v.id
		}
	)
)

type State = { content: RequestedContent<Value, ApiError | undefined> }
const slice = createSlice({
	name: "test",
	initialState: { content: { status: "idle" } } as State,
	reducers: {},
	extraReducers: (builder) => {
		addRequestedContentCases(builder, fetchValue, (s) => s.content, {
			errorSchema
		})
		addRequestedContentCases(builder, fetchWithFallback, (s) => s.content)
		addRequestedContentCases(builder, fetchEntity, (s) => s.content, {
			cases: ["fulfilled"]
		})
	}
})
// Les thunks sont typés sur le RootState de l'application : ce magasin de
// test n'en a qu'une tranche, d'où la conversion.
type TestStore = { dispatch: AppDispatch; getState: () => { test: State } }
const makeStore = () =>
	configureStore({
		reducer: { test: slice.reducer },
		middleware: (getDefault) =>
			getDefault({ thunk: { extraArgument: { api: () => undefined } } })
	}) as unknown as TestStore

describe("addRequestedContentCases", () => {
	beforeEach(() => {
		fail = undefined
		localStorage.clear()
	})

	it("goes idle → loading → success", async () => {
		const store = makeStore()
		const promise = store.dispatch(fetchValue())
		expect(store.getState().test.content.status).toBe("loading")
		await promise
		expect(store.getState().test.content).toEqual({
			status: "success",
			value: { name: "from api" },
			error: undefined
		})
	})

	it("stores the error on rejection and clears the previous value", async () => {
		const store = makeStore()
		await store.dispatch(fetchValue())
		fail = new Error("boom")
		await store.dispatch(fetchValue())
		expect(store.getState().test.content.status).toBe("error")
		expect(store.getState().test.content.value).toBeUndefined()
	})

	it("stores the body of an API refusal as the error", async () => {
		const store = makeStore()
		fail = httpError(409, { code: "ETAG_MISMATCH" })
		const action = await store.dispatch(fetchValue())
		expect(store.getState().test.content.error).toEqual({
			code: "ETAG_MISMATCH"
		})
		expect(isUnauthorizedRejection(action)).toBe(false)
	})

	it("flags a 401 refusal as unauthorized", async () => {
		const store = makeStore()
		fail = httpError(401, { code: "INVALID_TOKEN" })
		expect(isUnauthorizedRejection(await store.dispatch(fetchValue()))).toBe(
			true
		)
	})

	it("only registers the requested cases", async () => {
		const store = makeStore()
		fail = new Error("boom")
		await store.dispatch(fetchEntity({ id: "1" }))
		expect(store.getState().test.content.status).toBe("idle")
	})
})

describe("storage fallbacks", () => {
	beforeEach(() => {
		fail = undefined
		localStorage.clear()
	})

	it("serves the last stored value when the API fails", async () => {
		const store = makeStore()
		await store.dispatch(fetchWithFallback())
		expect(storage.getFromLocalStorage(valueSchema)).toEqual({
			name: "from api"
		})

		fail = new Error("offline")
		await store.dispatch(fetchWithFallback())
		expect(store.getState().test.content).toMatchObject({
			status: "success",
			value: { name: "from api" }
		})
	})

	it("rejects when nothing was stored", async () => {
		const store = makeStore()
		fail = new Error("offline")
		await store.dispatch(fetchWithFallback())
		expect(store.getState().test.content.status).toBe("error")
	})

	it("stores entities by id", async () => {
		const store = makeStore()
		await store.dispatch(fetchEntity({ id: "1" }))
		await store.dispatch(fetchEntity({ id: "2" }))

		fail = new Error("offline")
		await store.dispatch(fetchEntity({ id: "2" }))
		expect(store.getState().test.content.value).toEqual({ name: "entity 2" })
		const result = await store.dispatch(fetchEntity({ id: "3" }))
		expect(result.meta.requestStatus).toBe("rejected")
	})
})
