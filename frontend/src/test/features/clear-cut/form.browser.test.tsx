import { screen } from "@testing-library/react"
import type { UserEvent } from "@vitest/browser/context"
import { beforeEach, describe, expect, it } from "vitest"

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
import { worker } from "@/mocks/browser"
import { mockClearCutReportResponse } from "@/mocks/clear-cuts"
import { mockClearCutFormsResponse } from "@/mocks/clear-cuts-forms"
import { fakeDepartments } from "@/mocks/referential"
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
	form: Partial<ClearCutFormResponse> = {}
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
		{ ecologicalZoningsCount: 1, clearCutsCount: 1 }
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
const setupVolunteerAssigned = setupTest({ affectedUser: volunteerMock })
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
			itShouldHaveValue(items, section)
			itShouldHaveDisabledState(items, section, true)
		}
	}
)
function isShouldNotDisplayAdminSection(
	section: SectionForm,
	connectedUser?: Me
) {
	it("should not display the accordion", async () => {
		renderApp({
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
				const { user } = renderApp({
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
				const { user } = renderApp({
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

async function openAccordion(section: SectionForm, user: UserEvent) {
	const accordionButton = await screen.findByText(section.name, {
		selector: "button"
	})
	await user.click(accordionButton)
	return accordionButton
}
