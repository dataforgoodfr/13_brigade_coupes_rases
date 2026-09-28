import { screen } from "@testing-library/dom"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import type { UserEvent } from "vitest/browser"

import {
	actorsKey,
	actorsValue
} from "@/features/clear-cut/components/form/sections/ActorsSection"
import {
	ecoZoneKey,
	ecoZoneValue
} from "@/features/clear-cut/components/form/sections/EcoZoneSection"
import {
	generalInfoKey,
	generalInfoValue
} from "@/features/clear-cut/components/form/sections/GeneralInfoSection"
import {
	legalKey,
	legalValue
} from "@/features/clear-cut/components/form/sections/LegalSection"
import {
	onSiteKey,
	onSiteValue
} from "@/features/clear-cut/components/form/sections/OnSiteSection"
import {
	otherInfoKey,
	otherInfoValue
} from "@/features/clear-cut/components/form/sections/OtherInfoSection"
import {
	regulationsKey,
	regulationsValue
} from "@/features/clear-cut/components/form/sections/RegulationsSection"
import type {
	SectionForm,
	SectionFormItem
} from "@/features/clear-cut/components/form/types"
import type {
	ClearCutForm,
	ClearCutFormInput,
	ClearCutFormResponse,
	ClearCutReportResponse
} from "@/features/clear-cut/store/clear-cuts"
import type { Me } from "@/features/user/store/me"
import { setStoredToken } from "@/features/user/store/me.slice"
import { worker } from "@/mocks/browser"
import { mockClearCutReportResponse } from "@/mocks/clear-cuts"
import { mockClearCutFormsResponse } from "@/mocks/clear-cuts-forms"
import { fakeDepartments } from "@/mocks/referential"
import {
	addPendingPhoto,
	listPendingPhotos,
	removePendingPhoto
} from "@/shared/pendingPhotos"
import { adminMock, volunteerMock } from "@/test/mocks/user"
import {
	type FieldInput,
	formField,
	type TestFormItem
} from "@/test/page-object/form-input"
import { renderApp } from "@/test/renderApp"

type SectionData<
	Item extends
		SectionFormItem<ClearCutFormInput> = TestFormItem<ClearCutFormInput>
> = {
	section: SectionForm
	items: Item[]
}

const setupTest = (
	report: Partial<ClearCutReportResponse> = {},
	form: Partial<ClearCutFormResponse> = {},
	options = { ecologicalZoningsCount: 1, clearCutsCount: 1 }
) => {
	const reportMock = mockClearCutReportResponse(
		{
			id: "ABC",
			city: "Paris",
			lastCutDate: "2024-03-19",
			firstCutDate: "2024-02-03",
			departmentId: Object.keys(fakeDepartments)[0],
			updatedAt: "2026-03-13",
			slopeAreaHectare: 0.54556,
			totalAreaHectare: 1,
			averageLocation: { coordinates: [1, 2], type: "Point" },
			...report
		},
		options
	)
	const formMock = mockClearCutFormsResponse({
		reportId: reportMock.response.id,
		inspectionDate: "2024-03-19T14:26:30.789Z",
		weather: "Nuageux",
		forest: "Epicéa",
		wetland: "Présence de cours d'eau",
		soilState: "Sol en mauvais état",
		...form
	})

	type FormReport = { report: ClearCutReportResponse } & ClearCutFormResponse &
		Pick<ClearCutForm, "hasEcologicalZonings">
	const mapItem = (
		item: SectionFormItem<ClearCutFormInput>
	): TestFormItem<ClearCutFormInput> => {
		const formReport: FormReport = {
			report: reportMock.response,
			...formMock.response,
			hasEcologicalZonings: true
		}
		let expected: unknown
		if (item.name.startsWith("report.")) {
			expected =
				formReport.report[
					item.name.replace("report.", "") as keyof ClearCutReportResponse
				]
		} else {
			expected = formReport[item.name as keyof ClearCutFormResponse]
		}
		switch (item.type) {
			case "textArea":
				expected = expected === undefined ? "" : expected
				break
			case "inputFile":
				expected =
					Array.isArray(expected) && expected.length === 0
						? undefined
						: expected
				break
		}
		switch (item.name) {
			case "inspectionDate":
				expected = "19/03/2024"
				break
			case "report.slopeAreaHectare":
				expected = "0,55 ha"
				break
			case "report.totalAreaHectare":
				expected = `${expected} ha`
				break
			case "report.department.name":
				expected = "Ain"
				break
			case "report.averageLocation.coordinates.0":
				expected = "1"
				break
			case "report.averageLocation.coordinates.1":
				expected = "2"
				break
			case "report.updatedAt":
				expected = "13/03/2026"
				break
			case "report.reportedAt": {
				// "Date de signalement" falls back to createdAt and renders via
				// <FormattedDate> as dd/MM/yyyy.
				const iso =
					(expected as string | undefined) ?? formReport.report.createdAt
				const [year, month, day] = String(iso).split("-")
				expected = `${day}/${month}/${year}`
				break
			}
			case "report.lastCutDate":
				expected = "19/03/2024"
				break
			case "report.firstCutDate":
				expected = "03/02/2024"
				break
			default:
				break
		}

		return { ...item, expected: expected === undefined ? null : expected }
	}
	return {
		sections: [
			{
				section: actorsKey,
				items: actorsValue.map(mapItem)
			},
			{
				section: ecoZoneKey,
				items: ecoZoneValue.map(mapItem)
			},
			{
				section: generalInfoKey,
				items: generalInfoValue.map(mapItem)
			},
			{
				section: legalKey,
				items: legalValue.map(mapItem)
			},
			{
				section: onSiteKey,
				items: onSiteValue.map(mapItem)
			},
			{
				section: otherInfoKey,
				items: otherInfoValue.map(mapItem)
			},
			{
				section: regulationsKey,
				items: regulationsValue.map(mapItem)
			}
		] as SectionData[],
		reportMock,
		formMock
	}
}

const defaultSetup = setupTest()
const defaultSetupServerBeforeEach = (setup: ReturnType<typeof setupTest>) => {
	beforeEach(() => {
		worker.use(setup.reportMock.handler, setup.formMock.handler)
	})
}
const setupVolunteerAssigned = setupTest({
	affectedUser: volunteerMock,
	status: "in_progress"
})
describe.each(setupVolunteerAssigned.sections)(
	"$section.name section form when there is volunteer assigned",
	({ section, items }) => {
		defaultSetupServerBeforeEach(setupVolunteerAssigned)
		if (section.name === "Stratégie juridique") {
			isShouldNotDisplayAdminSection(section)
		} else {
			itShouldHaveValue(items, section, volunteerMock)
			itShouldHaveDisabledState(items, section, false, volunteerMock)
		}
	}
)

describe.each(defaultSetup.sections)(
	"$section.name section form when there is volunteer not assigned",
	({ section, items }) => {
		defaultSetupServerBeforeEach(defaultSetup)
		if (section.name === "Stratégie juridique") {
			isShouldNotDisplayAdminSection(section)
		} else {
			itShouldHaveValue(items, section, volunteerMock)
			itShouldHaveDisabledState(items, section, true, volunteerMock)
		}
	}
)
describe.each(defaultSetup.sections)(
	"$section.name section form when there is a connected admin",
	({ section, items }) => {
		defaultSetupServerBeforeEach(defaultSetup)
		itShouldHaveValue(items, section, adminMock)
		itShouldHaveDisabledState(items, section, false, adminMock)
	}
)
describe.each(defaultSetup.sections)(
	"$section.name section form when there isn't a connected user",
	({ section, items }) => {
		defaultSetupServerBeforeEach(defaultSetup)
		if (section.name === "Stratégie juridique") {
			isShouldNotDisplayAdminSection(section)
		} else {
			// The field form is only served to connected accounts: a visitor sees
			// the report data, never the volunteer's notes
			itShouldHaveValue(
				items.filter((item) => item.name.startsWith("report.")),
				section
			)
			itShouldHaveDisabledState(items, section, true)
		}
	}
)

describe("field form when there isn't a connected user", () => {
	defaultSetupServerBeforeEach(defaultSetup)
	it("is not displayed even though the server would return one", async () => {
		const { user } = await renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: "ABC" }
		})
		await openAccordion(onSiteKey, user)
		const weather = defaultSetup.sections
			.find(({ section }) => section === onSiteKey)
			?.items.find(
				(item) => item.name === "weather"
			) as TestFormItem<ClearCutFormInput>
		const field = formField<ClearCutFormInput, unknown>({
			user,
			item: weather
		}) as FieldInput
		expect(await field.findValue()).toBe("")
	})
})
describe("general info edition controls", () => {
	const editButton = () =>
		screen.queryByRole("button", { name: /Modifier les informations/ })
	const openGeneralInfo = async (connectedUser?: Me) => {
		const { user } = await renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: "ABC" },
			user: connectedUser
		})
		await openAccordion(generalInfoKey, user)
	}

	describe("when an admin is connected", () => {
		defaultSetupServerBeforeEach(defaultSetup)
		it("shows the edit button", async () => {
			await openGeneralInfo(adminMock)
			expect(editButton()).toBeInTheDocument()
		})
		it("shows the perimeter edit button for a single-cut report", async () => {
			await openGeneralInfo(adminMock)
			expect(
				screen.getByRole("button", { name: /Modifier le périmètre/ })
			).toBeInTheDocument()
		})
	})

	describe("when the report has several cuts", () => {
		defaultSetupServerBeforeEach(
			setupTest({}, {}, { ecologicalZoningsCount: 1, clearCutsCount: 2 })
		)
		it("hides the perimeter edit button", async () => {
			await openGeneralInfo(adminMock)
			expect(editButton()).toBeInTheDocument()
			expect(
				screen.queryByRole("button", { name: /Modifier le périmètre/ })
			).not.toBeInTheDocument()
		})
	})

	describe("when the assigned volunteer is connected", () => {
		defaultSetupServerBeforeEach(setupTest({ userId: volunteerMock.id }))
		it("shows the edit button", async () => {
			await openGeneralInfo(volunteerMock)
			expect(editButton()).toBeInTheDocument()
		})
	})

	describe("when a volunteer not assigned is connected", () => {
		defaultSetupServerBeforeEach(defaultSetup)
		it("hides the edit button", async () => {
			await openGeneralInfo(volunteerMock)
			expect(editButton()).not.toBeInTheDocument()
		})
	})

	describe("when the report was manually edited", () => {
		defaultSetupServerBeforeEach(
			setupTest({ isManuallyEdited: true, manuallyEditedAt: "2026-04-02" })
		)
		it("shows the badge to everyone and the pipeline switch to admins", async () => {
			await openGeneralInfo(volunteerMock)
			expect(await screen.findByText(/Édité manuellement/)).toBeInTheDocument()
			expect(screen.queryByRole("switch")).not.toBeInTheDocument()
		})
		it("lets an admin re-enable the pipeline", async () => {
			await openGeneralInfo(adminMock)
			expect(await screen.findByRole("switch")).toBeInTheDocument()
		})
	})
})

describe("assignment request", () => {
	const requestButtons = () =>
		screen.queryAllByRole("button", { name: "Demander l'attribution" })
	const openAsVolunteer = () =>
		renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: "ABC" },
			user: volunteerMock
		})
	const free = { userId: undefined, assignmentRequestedById: undefined }

	describe("when the report is still to validate", () => {
		defaultSetupServerBeforeEach(setupTest({ ...free, status: "to_validate" }))
		it("lets a volunteer request it", async () => {
			await openAsVolunteer()
			expect(
				await screen.findAllByRole("button", {
					name: "Demander l'attribution"
				})
			).not.toHaveLength(0)
		})
	})

	describe("when the report has been decided", () => {
		defaultSetupServerBeforeEach(setupTest({ ...free, status: "rejected" }))
		it("offers no request", async () => {
			await openAsVolunteer()
			await screen.findAllByText("Rejeté")
			expect(requestButtons()).toHaveLength(0)
		})
	})
})

function isShouldNotDisplayAdminSection(
	section: SectionForm,
	connectedUser?: Me
) {
	it("should not display the accordion", async () => {
		await renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: "ABC" },
			user: connectedUser
		})
		const accordionButton = screen.queryByText(section.name, {
			selector: "button"
		})
		expect(accordionButton).not.toBeInTheDocument()
	})
}
function itShouldHaveValue(
	items: TestFormItem<ClearCutFormInput>[],
	section: SectionForm,
	connectedUser?: Me
) {
	return items
		.filter((item) => item.renderConditions.length === 0)
		.map((item) =>
			it(`${item.label ?? item.name} should have value ${
				item.expected
			}`, async () => {
				const { user } = await renderApp({
					route: "/clear-cuts/$clearCutId",
					params: { $clearCutId: "ABC" },
					user: connectedUser
				})
				await openAccordion(section, user)
				const field = formField<ClearCutFormInput, unknown>({
					user,
					item: item
				}) as FieldInput
				const value = await field.findValue()
				expect(value).toBe(item.expected)
			})
		)
}
function itShouldHaveDisabledState(
	items: TestFormItem<ClearCutFormInput>[],
	section: SectionForm,
	state: boolean,
	connectedUser?: Me
) {
	return items
		.filter(
			(item) => item.renderConditions.length === 0 && item.type !== "fixed"
		)
		.forEach((item) => {
			it(`should display the ${item.type} for "${
				item.label ?? item.name
			}", its label, and it should be ${
				state ? "disabled" : "enabled"
			}`, async () => {
				const { user } = await renderApp({
					route: "/clear-cuts/$clearCutId",
					params: { $clearCutId: "ABC" },
					user: connectedUser
				})
				await openAccordion(section, user)
				const field = formField<ClearCutFormInput, unknown>({
					user,
					item: item
				}) as FieldInput
				await field.expectDisabledState(state)
			})
		})
}

const FAKE_JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl"

describe("photo upload", () => {
	defaultSetupServerBeforeEach(setupVolunteerAssigned)
	beforeEach(() => {
		worker.use(
			http.post("*/api/v1/images/upload-url", async ({ request }) => {
				const { filename } = (await request.json()) as { filename: string }
				const key = `local/reports/ABC/${filename}`
				return HttpResponse.json({
					uploadUrl: "http://localhost:8080/api/v1/images/local-upload",
					fields: {},
					fileUrl: `http://localhost:8080/api/v1/images/${key}`,
					expiresIn: 3600,
					key
				})
			}),
			http.post(
				"*/api/v1/images/local-upload",
				() => new HttpResponse(null, { status: 204 })
			),
			http.get("*/api/v1/images/view/*", ({ request }) =>
				HttpResponse.json({ viewUrl: `${request.url}.jpg`, expiresIn: 3600 })
			)
		)
	})

	it("keeps every photo of a multiple selection", async () => {
		const { user } = await renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: "ABC" },
			user: volunteerMock
		})
		// L'envoi exige un jeton stocké, que renderApp ne pose pas
		setStoredToken({ accessToken: FAKE_JWT, refreshToken: FAKE_JWT })
		await openAccordion(onSiteKey, user)
		const input = await screen.findByLabelText(
			"Sélectionner des photos — Photos de la coupe"
		)
		await user.upload(input, [
			new File(["a"], "coupe-1.jpg", { type: "image/jpeg" }),
			new File(["b"], "coupe-2.jpg", { type: "image/jpeg" })
		])
		expect(await screen.findByText("2 photos")).toBeInTheDocument()
	})

	it("stops sending when the user cancels", async () => {
		worker.use(
			http.post("*/api/v1/images/upload-url", async () => {
				await new Promise((resolve) => setTimeout(resolve, 2000))
				return HttpResponse.json({
					uploadUrl: "http://localhost:8080/api/v1/images/local-upload",
					fields: {},
					fileUrl: "http://localhost:8080/api/v1/images/local/x.jpg",
					expiresIn: 3600,
					key: "local/reports/ABC/x.jpg"
				})
			})
		)
		const { user } = await renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: "ABC" },
			user: volunteerMock
		})
		setStoredToken({ accessToken: FAKE_JWT, refreshToken: FAKE_JWT })
		await openAccordion(onSiteKey, user)
		const input = await screen.findByLabelText(
			"Sélectionner des photos — Photos de la coupe"
		)
		await user.upload(input, [
			new File(["a"], "coupe-1.jpg", { type: "image/jpeg" }),
			new File(["b"], "coupe-2.jpg", { type: "image/jpeg" })
		])
		await user.click(await screen.findByRole("button", { name: "Annuler" }))

		await expect
			.poll(() => screen.queryByRole("button", { name: "Annuler" }))
			.toBeNull()
		await new Promise((resolve) => setTimeout(resolve, 2500))
		expect(screen.queryByText(/^\d+ photos?$/)).not.toBeInTheDocument()
		expect(screen.queryByText(/pas pu être envoyée/)).not.toBeInTheDocument()
		expect(screen.queryByText(/en attente d'envoi/)).not.toBeInTheDocument()
	})

	it("deletes the photo shown, even when another one cannot be displayed", async () => {
		worker.use(
			http.get("*/api/v1/images/view/*", ({ request }) =>
				request.url.includes("coupe-2")
					? new HttpResponse(null, { status: 404 })
					: HttpResponse.json({
							// A displayable image carrying the photo's name
							viewUrl: `data:image/svg+xml,${encodeURIComponent(
								`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><title>${request.url.split("/").pop()}</title><rect width="10" height="10"/></svg>`
							)}`,
							expiresIn: 3600
						})
			)
		)
		const { user } = await renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: "ABC" },
			user: volunteerMock
		})
		setStoredToken({ accessToken: FAKE_JWT, refreshToken: FAKE_JWT })
		await openAccordion(onSiteKey, user)
		const input = await screen.findByLabelText(
			"Sélectionner des photos — Photos de la coupe"
		)
		await user.upload(
			input,
			["coupe-1.jpg", "coupe-2.jpg", "coupe-3.jpg"].map(
				(name) => new File([name], name, { type: "image/jpeg" })
			)
		)
		// The photo that cannot be displayed still counts
		expect(await screen.findByText("3 photos")).toBeInTheDocument()
		const shown = await screen.findAllByAltText(/^Prise de vue \d+$/)
		const third = shown.findIndex((img) =>
			img.getAttribute("src")?.includes("coupe-3")
		)
		await user.click(screen.getByLabelText(`Supprimer la photo ${third + 1}`))
		// Going back keeps the photo
		await user.click(await screen.findByRole("button", { name: "Retour" }))
		expect(screen.getByText("3 photos")).toBeInTheDocument()
		await user.click(screen.getByLabelText(`Supprimer la photo ${third + 1}`))
		await user.click(await screen.findByRole("button", { name: "Supprimer" }))
		expect(await screen.findByText("2 photos")).toBeInTheDocument()
		const remaining = screen
			.getAllByAltText(/^Prise de vue \d+$/)
			.map((img) => img.getAttribute("src") ?? "")
		expect(remaining.some((src) => src.includes("coupe-3"))).toBe(false)
		expect(remaining.some((src) => src.includes("coupe-1"))).toBe(true)
	})
})

describe("photos taken without network", () => {
	defaultSetupServerBeforeEach(setupVolunteerAssigned)
	let network = false
	beforeEach(async () => {
		network = false
		for (const p of await listPendingPhotos("ABC", "clearCutImages")) {
			await removePendingPhoto(p.id)
		}
		worker.use(
			http.post("*/api/v1/images/upload-url", async ({ request }) => {
				if (!network) return HttpResponse.error()
				const { filename } = (await request.json()) as { filename: string }
				const key = `local/reports/ABC/${filename}`
				return HttpResponse.json({
					uploadUrl: "http://localhost:8080/api/v1/images/local-upload",
					fields: {},
					fileUrl: `http://localhost:8080/api/v1/images/${key}`,
					expiresIn: 3600,
					key
				})
			}),
			http.post(
				"*/api/v1/images/local-upload",
				() => new HttpResponse(null, { status: 204 })
			),
			http.get("*/api/v1/images/view/*", ({ request }) =>
				HttpResponse.json({ viewUrl: `${request.url}.jpg`, expiresIn: 3600 })
			)
		)
	})

	it("keeps the photo on the device and sends it when the network is back", async () => {
		const { user } = await renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: "ABC" },
			user: volunteerMock
		})
		setStoredToken({ accessToken: FAKE_JWT, refreshToken: FAKE_JWT })
		await openAccordion(onSiteKey, user)
		const input = await screen.findByLabelText(
			"Sélectionner des photos — Photos de la coupe"
		)
		await user.upload(
			input,
			new File(["a"], "coupe.jpg", { type: "image/jpeg" })
		)

		expect(
			await screen.findByText(/1 photo en attente d'envoi/, undefined, {
				timeout: 10000
			})
		).toBeInTheDocument()
		expect(await listPendingPhotos("ABC", "clearCutImages")).toHaveLength(1)

		network = true
		window.dispatchEvent(new Event("online"))

		expect(await screen.findByText("1 photo")).toBeInTheDocument()
		expect(screen.queryByText(/en attente d'envoi/)).not.toBeInTheDocument()
		expect(await listPendingPhotos("ABC", "clearCutImages")).toHaveLength(0)
	})

	it("sends a photo kept from an earlier visit when the form opens", async () => {
		network = true
		await addPendingPhoto({
			reportId: "ABC",
			field: "clearCutImages",
			file: new File(["a"], "gardee.jpg", { type: "image/jpeg" })
		})
		const { user } = await renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: "ABC" },
			user: volunteerMock
		})
		setStoredToken({ accessToken: FAKE_JWT, refreshToken: FAKE_JWT })
		await openAccordion(onSiteKey, user)

		expect(await screen.findByText("1 photo")).toBeInTheDocument()
		expect(await listPendingPhotos("ABC", "clearCutImages")).toHaveLength(0)
	})
})

async function openAccordion(section: SectionForm, user: UserEvent) {
	const accordionButton = await screen.findByText(section.name, {
		selector: "button"
	})
	await user.click(accordionButton)
	return accordionButton
}
