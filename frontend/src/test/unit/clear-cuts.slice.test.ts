import { describe, expect, it } from "vitest"

import type { ClearCutFormVersions } from "@/features/clear-cut/store/clear-cuts"
import {
	clearCutsSlice,
	getClearCutFormThunk,
	selectDetail
} from "@/features/clear-cut/store/clear-cuts-slice"
import { setupStore } from "@/shared/store/store"

const { replaceCurrentVersionByLatest } = clearCutsSlice.actions

// Le réducteur ne lit que les versions : un formulaire minimal suffit.
const form = (etag: string) => ({ etag }) as ClearCutFormVersions["current"]
const versions = (latest?: string): ClearCutFormVersions => ({
	original: form("1"),
	current: form("1-edited"),
	latest: latest === undefined ? undefined : form(latest),
	versionMismatchDisclaimerShown: false
})

describe("replaceCurrentVersionByLatest", () => {
	it("adopts the server version and remembers the disclaimer was shown", () => {
		const store = setupStore()
		store.dispatch(
			getClearCutFormThunk.fulfilled(versions("2"), "r", { id: "1" })
		)

		store.dispatch(replaceCurrentVersionByLatest())

		const detail = selectDetail(store.getState())
		expect(detail.value?.current).toEqual(form("2"))
		expect(detail.value?.original).toEqual(form("2"))
		expect(detail.value?.versionMismatchDisclaimerShown).toBe(true)
	})

	it("does nothing without a server version", () => {
		const store = setupStore()
		store.dispatch(getClearCutFormThunk.fulfilled(versions(), "r", { id: "1" }))

		store.dispatch(replaceCurrentVersionByLatest())

		expect(selectDetail(store.getState()).value).toEqual(versions())
	})

	it("does nothing while no form is loaded", () => {
		const store = setupStore()
		store.dispatch(replaceCurrentVersionByLatest())
		expect(selectDetail(store.getState())).toEqual({ status: "idle" })
	})
})
