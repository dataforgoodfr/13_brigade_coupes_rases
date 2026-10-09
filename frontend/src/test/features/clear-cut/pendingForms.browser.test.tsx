import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"

import {
	getClearCutFormThunk,
	selectDetail,
	sendPendingFormsThunk,
	submitClearCutFormThunk
} from "@/features/clear-cut/store/clear-cuts-slice"
import {
	getPendingForms,
	resetPendingFormsCache,
	setFormPending
} from "@/features/clear-cut/store/pendingForms"
import { initialState } from "@/features/user/store/me.slice"
import { worker } from "@/mocks/browser"
import { mockClearCutReportResponse } from "@/mocks/clear-cuts"
import { mockClearCutFormsResponse } from "@/mocks/clear-cuts-forms"
import { getReferentialThunk } from "@/shared/store/referential/referential.slice"
import { setupStore } from "@/shared/store/store"
import { volunteerMock } from "@/test/mocks/user"

const REPORT = "42"
const FORMS = "*/api/v1/clear-cuts-reports/:id/forms"

/** Every form POST received, with the version it claims to be based on. */
function answerPosts(reply: () => Response) {
	const posts: { etag: string | null }[] = []
	worker.use(
		http.post(FORMS, ({ request }) => {
			posts.push({ etag: request.headers.get("etag") })
			return reply()
		})
	)
	return posts
}

// Field forms are only fetched for a connected account
const connectedStore = () =>
	setupStore({
		me: { ...initialState, me: { status: "success", value: volunteerMock } }
	})

/** A store with the report opened once, so its form is kept on the device. */
async function storeWithKeptForm() {
	const forms = mockClearCutFormsResponse()
	worker.use(mockClearCutReportResponse().handler, forms.handler)
	const store = connectedStore()
	await store.dispatch(getReferentialThunk())
	await store.dispatch(getClearCutFormThunk({ id: REPORT }))
	const current = selectDetail(store.getState()).value?.current
	if (!current) throw new Error("form not loaded")
	return { store, current }
}

describe("forms saved without network", () => {
	beforeEach(() => {
		resetPendingFormsCache()
	})

	it("are flagged when the save cannot reach the server", async () => {
		const { store, current } = await storeWithKeptForm()
		answerPosts(() => HttpResponse.error())

		await store.dispatch(
			submitClearCutFormThunk({ reportId: REPORT, formData: current })
		)

		expect(getPendingForms()).toEqual({ [REPORT]: "offline" })
	})

	it("are sent once the network is back, with the version they were edited from", async () => {
		const { store, current } = await storeWithKeptForm()
		setFormPending(REPORT, "offline")
		const posts = answerPosts(() => HttpResponse.json({}, { status: 201 }))

		await store.dispatch(sendPendingFormsThunk())

		expect(posts).toEqual([{ etag: current.etag ?? null }])
		expect(getPendingForms()).toEqual({})
	})

	it("stay flagged while the network is still down", async () => {
		const { store } = await storeWithKeptForm()
		setFormPending(REPORT, "offline")
		answerPosts(() => HttpResponse.error())

		await store.dispatch(sendPendingFormsThunk())

		expect(getPendingForms()).toEqual({ [REPORT]: "offline" })
	})

	it("wait for the volunteer when a newer version was saved meanwhile", async () => {
		const { store } = await storeWithKeptForm()
		setFormPending(REPORT, "offline")
		const posts = answerPosts(() =>
			HttpResponse.json({ detail: "etag mismatch" }, { status: 409 })
		)

		await store.dispatch(sendPendingFormsThunk())
		await store.dispatch(sendPendingFormsThunk())

		expect(getPendingForms()).toEqual({ [REPORT]: "conflict" })
		expect(posts).toHaveLength(1)
	})

	it("are not sent again while only their photos are waiting", async () => {
		const { store } = await storeWithKeptForm()
		setFormPending(REPORT, "photos")
		const posts = answerPosts(() => HttpResponse.json({}, { status: 201 }))

		await store.dispatch(sendPendingFormsThunk())

		expect(posts).toHaveLength(0)
		expect(getPendingForms()).toEqual({ [REPORT]: "photos" })
	})

	it("are forgotten when their report is no longer on the device", async () => {
		setFormPending("unknown", "offline")
		const posts = answerPosts(() => HttpResponse.json({}, { status: 201 }))

		await connectedStore().dispatch(sendPendingFormsThunk())

		expect(posts).toHaveLength(0)
		expect(getPendingForms()).toEqual({})
	})
})
