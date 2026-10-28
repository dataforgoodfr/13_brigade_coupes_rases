import { fakerFR as faker } from "@faker-js/faker"
import { HttpResponse, http } from "msw"

import type {
	ClearCutFormCreate,
	ClearCutFormResponse,
	ClearCutReportResponse,
	ClearCutStatus,
	MultiPolygon,
	Point,
	PublicUser
} from "@/features/clear-cut/store/clear-cuts"
import {
	clearCutPreviews,
	createClearCutReportResponseBaseMock,
	createClearCutResponseMock,
	FORESTS
} from "@/mocks/clear-cuts"
import { createPaginationOneElementMock } from "@/mocks/pagination"
import { meFromRequest } from "@/mocks/users"

/**
 * Answers of the public demo that keep what the visitor does for the browser
 * session (the app reloads the page after some actions): assignment requests,
 * saved forms, reported clear cuts. Tests keep the stateless mocks of
 * `handlers.ts`.
 */

const STORAGE_KEY = "demo-state"
type DemoState = {
	reports: Record<string, ClearCutReportResponse>
	forms: Record<string, ClearCutFormResponse>
}

const readState = (): DemoState => {
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY)
		if (stored) return JSON.parse(stored)
	} catch {
		// Storage unavailable: the demo starts afresh on each page
	}
	return { reports: {}, forms: {} }
}
const state = readState()

// The seeded previews are the same on every page load: replay the changes
for (const report of Object.values(state.reports)) {
	const preview = clearCutPreviews.find((r) => r.id === report.id)
	if (preview) Object.assign(preview, report)
	else clearCutPreviews.push(report)
}

const save = (report?: ClearCutReportResponse) => {
	if (report) state.reports[report.id] = report
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
	} catch {
		// Kept for this page only
	}
}

const reports = () => new Map(clearCutPreviews.map((r) => [r.id, r]))
const forms = {
	get: (reportId: string) => state.forms[reportId],
	set: (reportId: string, form: ClearCutFormResponse) => {
		state.forms[reportId] = form
		save()
	}
}

const CITIES = FORESTS.flatMap(({ cities }) => cities).map((name, index) => ({
	insee_code: String(10_000 + index),
	name,
	department_code: "00"
}))

const publicUser = (request: Request): PublicUser & { id: string } => {
	const { id, login, email } = meFromRequest(request)
	return { id, login, email }
}

type Action = (
	report: ClearCutReportResponse,
	user: PublicUser & { id: string }
) => void

const HOLDER_STATUSES: ClearCutStatus[] = [
	"in_progress",
	"waiting_for_validation"
]

/** The assignment and validation workflow of the backend, simplified */
const ACTIONS: Record<string, Action> = {
	"request-assignment": (report, { id, login, email }) => {
		report.assignmentRequestedById = id
		report.assignmentRequestedBy = { login, email }
	},
	"cancel-request": (report) => {
		report.assignmentRequestedById = null
		report.assignmentRequestedBy = null
	},
	"approve-assignment": (report) => {
		report.userId = report.assignmentRequestedById
		report.affectedUser = report.assignmentRequestedBy
		report.assignmentRequestedById = null
		report.assignmentRequestedBy = null
		if (report.status === "to_validate") report.status = "in_progress"
	},
	"reject-assignment": (report) => {
		report.assignmentRequestedById = null
		report.assignmentRequestedBy = null
	},
	unassign: (report) => {
		report.userId = null
		report.affectedUser = null
		if (HOLDER_STATUSES.includes(report.status)) report.status = "to_validate"
	},
	"volunteer-validate": (report) => {
		report.status = "waiting_for_validation"
	},
	"approve-validation": (report) => {
		report.status = "validated"
	},
	"reject-validation": (report) => {
		report.status = "rejected"
	},
	reopen: (report) => {
		report.status = report.affectedUser ? "in_progress" : "to_validate"
	}
}

const isMine = (report: ClearCutReportResponse, login: string) =>
	report.affectedUser?.login === login ||
	report.assignmentRequestedBy?.login === login

const page = (content: ClearCutReportResponse[]) => ({
	content,
	metadata: {
		links: {},
		page: 0,
		size: content.length,
		pagesCount: 1,
		totalCount: content.length
	}
})

export const demoHandlers = [
	http.get("*/api/v1/clear-cuts-reports/", ({ request }) => {
		const params = new URL(request.url).searchParams
		const { login } = publicUser(request)
		const all = [...reports().values()]
		if (params.get("assigned_to_me") === "true") {
			return HttpResponse.json(page(all.filter((r) => isMine(r, login))))
		}
		if (params.get("admin_action_required") === "true") {
			return HttpResponse.json(
				page(
					all.filter(
						(r) =>
							r.assignmentRequestedBy || r.status === "waiting_for_validation"
					)
				)
			)
		}
		return HttpResponse.json(page(all))
	}),
	http.get("*/api/v1/clear-cuts-reports/:id/forms", ({ params }) => {
		const form = forms.get(params.id as string)
		// No saved form yet: the default mock answers
		if (!form) return
		return HttpResponse.json(createPaginationOneElementMock(form))
	}),
	http.post(
		"*/api/v1/clear-cuts-reports/:id/forms",
		async ({ params, request }) => {
			const reportId = params.id as string
			const body = (await request.json()) as ClearCutFormCreate
			const createdAt = new Date()
			const id = faker.string.uuid()
			forms.set(reportId, {
				...body,
				id,
				reportId,
				createdAt: createdAt.toISOString().replace("Z", ""),
				etag: createdAt.getTime().toString(10)
			})
			return HttpResponse.json(null, {
				status: 201,
				headers: {
					location: `/api/v1/clear-cuts-reports/${reportId}/forms/${id}`
				}
			})
		}
	),
	http.post(
		"*/api/v1/clear-cuts-reports/volunteer-create",
		async ({ request }) => {
			const { polygon, city_zip_code } = (await request.json()) as {
				polygon: { type: string; coordinates: unknown }
				city_zip_code: string
			}
			const boundary = (
				polygon.type === "Polygon"
					? { type: "MultiPolygon", coordinates: [polygon.coordinates] }
					: polygon
			) as MultiPolygon
			const ring = boundary.coordinates[0][0]
			const location: Point = {
				type: "Point",
				coordinates: [
					ring.reduce((sum, [lng]) => sum + lng, 0) / ring.length,
					ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length
				]
			}
			const { id, login, email } = publicUser(request)
			const report = createClearCutReportResponseBaseMock(
				{
					averageLocation: location,
					city: CITIES.find((c) => c.insee_code === city_zip_code)?.name ?? "",
					status: "to_validate",
					rulesIds: [],
					assignmentRequestedById: id,
					assignmentRequestedBy: { login, email },
					clearCuts: [createClearCutResponseMock({ boundary, location })]
				},
				{ clearCutsCount: 0 }
			)
			clearCutPreviews.push(report)
			save(report)
			return HttpResponse.json(
				{
					id: report.id,
					message:
						"Votre signalement a bien été enregistré. Un administrateur l'examinera et le validera prochainement."
				},
				{ status: 201 }
			)
		}
	),
	http.get("*/api/v1/clear-cuts-reports/:id", ({ params }) => {
		const report = reports().get(params.id as string)
		if (!report) return
		return HttpResponse.json(report)
	}),
	http.put("*/api/v1/clear-cuts-reports/:id", async ({ params, request }) => {
		const report = reports().get(params.id as string)
		const { status } = (await request.json()) as { status?: ClearCutStatus }
		if (report && status) {
			report.status = status
			save(report)
		}
		return new HttpResponse(null, { status: 204 })
	}),
	http.post(
		"*/api/v1/clear-cuts-reports/:id/:action",
		({ params, request }) => {
			const report = reports().get(params.id as string)
			const action = ACTIONS[params.action as string]
			if (!report || !action) return
			action(report, publicUser(request))
			save(report)
			return HttpResponse.json({ message: "OK" })
		}
	),
	http.get("*/api/v1/cities/search", ({ request }) => {
		const query = (new URL(request.url).searchParams.get("q") ?? "")
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "")
			.toLowerCase()
		return HttpResponse.json(
			CITIES.filter(({ name }) =>
				name
					.normalize("NFD")
					.replace(/\p{Diacritic}/gu, "")
					.toLowerCase()
					.includes(query)
			)
		)
	})
]
