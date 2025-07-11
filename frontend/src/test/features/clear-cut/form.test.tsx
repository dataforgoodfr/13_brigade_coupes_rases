import {
	actorsKey,
	actorsValue,
} from "@/features/clear-cut/components/form/sections/ActorsSection";
import {
	ecoZoneKey,
	ecoZoneValue,
} from "@/features/clear-cut/components/form/sections/EcoZoneSection";
import {
	generalInfoKey,
	generalInfoValue,
} from "@/features/clear-cut/components/form/sections/GeneralInfoSection";
import {
	legalKey,
	legalValue,
} from "@/features/clear-cut/components/form/sections/LegalSection";
import {
	onSiteKey,
	onSiteValue,
} from "@/features/clear-cut/components/form/sections/OnSiteSection";
import {
	otherInfoKey,
	otherInfoValue,
} from "@/features/clear-cut/components/form/sections/OtherInfoSection";
import {
	regulationsKey,
	regulationsValue,
} from "@/features/clear-cut/components/form/sections/RegulationsSection";
import type {
	SectionForm,
	SectionFormItem,
} from "@/features/clear-cut/components/form/types";

import type {
	ClearCutForm,
	ClearCutFormResponse,
} from "@/features/clear-cut/store/clear-cuts";
import type { User } from "@/features/user/store/user";
import { mockClearCut, mockClearCutFormsResponse } from "@/mocks/clear-cuts";
import { fakeDepartments } from "@/mocks/referential";
import { server } from "@/test/mocks/server";
import { adminMock, volunteerMock } from "@/test/mocks/user";
import {
	type FieldInput,
	type TestFormItem,
	formField,
} from "@/test/page-object/form-input";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

type SectionData<
	Item extends SectionFormItem<ClearCutForm> = TestFormItem<ClearCutForm>,
> = {
	section: SectionForm;
	items: Item[];
};
const mock = mockClearCut({
	id: "ABC",
	city: "Paris",
	last_cut_date: "2024-03-19",
	onSiteDate: "2024-03-19T14:26:30.789Z",
	weather: "Nuageux",
	standTypeAndSilviculturalSystemBCC: "Epicéa",
	waterCourseOrWetlandPresence: "Présence de cours d'eau",
	soilState: "Sol en mauvais état",
	department_id: Object.keys(fakeDepartments)[0],
	updated_at: "2026-03-13",
	slope_area_hectare: 0.54556,
	total_area_hectare: 1,
	average_location: { coordinates: [1, 2], type: "Point" },
});

const mapItem = (
	item: SectionFormItem<ClearCutForm>,
): TestFormItem<ClearCutForm> => {
	let expected = mock.response[item.name as keyof ClearCutFormResponse];

	switch (item.type) {
		case "textArea":
			expected = expected === undefined ? "" : expected;
			break;
		case "inputFile":
			expected =
				Array.isArray(expected) && expected.length === 0 ? null : expected;
			break;
	}
	switch (item.name) {
		case "last_cut_date":
			expected = "19/03/2024";
			break;
		case "slope_area_hectare":
			expected = "0,55 ha";
			break;
		case "total_area_hectare":
			expected = `${expected} ha`;
			break;
		case "department.name":
			expected = "Ain";
			break;
		case "average_location.coordinates.0":
			expected = "1";
			break;
		case "average_location.coordinates.1":
			expected = "2";
			break;
		case "updated_at":
			expected = "13/03/2026";
			break;
		case "onSiteDate":
			expected = "19/03/2024";
			break;
		default:
			break;
	}

	return { ...item, expected: expected === undefined ? null : expected };
};
const sections: SectionData[] = [
	{
		section: actorsKey,
		items: actorsValue.map(mapItem),
	},
	{
		section: ecoZoneKey,
		items: ecoZoneValue.map(mapItem),
	},
	{
		section: generalInfoKey,
		items: generalInfoValue.map(mapItem),
	},
	{
		section: legalKey,
		items: legalValue.map(mapItem),
	},
	{
		section: onSiteKey,
		items: onSiteValue.map(mapItem),
	},
	{
		section: otherInfoKey,
		items: otherInfoValue.map(mapItem),
	},
	{
		section: regulationsKey,
		items: regulationsValue.map(mapItem),
	},
];
describe.each(sections)(
	"$section.name section form when there is volunteer assigned",
	({ section, items }) => {
		beforeEach(() => {
			const assignedClearCutMock = mockClearCut({
				...mock.response,
				assignedUser: volunteerMock.login,
			});
			server.use(assignedClearCutMock.handler);
		});
		if (section.name === "Stratégie juridique") {
			isShouldNotDisplayAdminSection(section);
		} else {
			itShouldHaveValue(items, section, volunteerMock);
			itShouldHaveDisabledState(items, section, false, volunteerMock);
		}
	},
);
describe.each(sections)(
	"$section.name section form when there is volunteer not assigned",
	({ section, items }) => {
		beforeEach(() => {
			server.use(mock.handler, mockClearCutFormsResponse());
		});
		if (section.name === "Stratégie juridique") {
			isShouldNotDisplayAdminSection(section);
		} else {
			itShouldHaveValue(items, section, volunteerMock);
			itShouldHaveDisabledState(items, section, true, volunteerMock);
		}
	},
);
describe.each(sections)(
	"$section.name section form when there is a connected admin",
	({ section, items }) => {
		beforeEach(() => {
			server.use(mock.handler, mockClearCutFormsResponse());
		});
		itShouldHaveValue(items, section, adminMock);
		itShouldHaveDisabledState(items, section, false, adminMock);
	},
);
describe.each(sections)(
	"$section.name section form when there isn't a connected user",
	({ section, items }) => {
		beforeEach(() => {
			server.use(mock.handler, mockClearCutFormsResponse());
		});
		if (section.name === "Stratégie juridique") {
			isShouldNotDisplayAdminSection(section);
		} else {
			itShouldHaveValue(items, section);
			itShouldHaveDisabledState(items, section, true);
		}
	},
);
function isShouldNotDisplayAdminSection(
	section: SectionForm,
	connectedUser?: User,
) {
	it("should not display the accordion", async () => {
		renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: "ABC" },
			user: connectedUser,
		});
		const accordionButton = screen.queryByText(section.name, {
			selector: "button",
		});
		expect(accordionButton).not.toBeInTheDocument();
	});
}
function itShouldHaveValue(
	items: TestFormItem<ClearCutForm>[],
	section: SectionForm,
	connectedUser?: User,
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
					user: connectedUser,
				});
				await openAccordion(section, user);
				const field = formField<ClearCutForm, unknown>({
					user,
					item: item,
				}) as FieldInput;
				const value = await field.findValue();
				expect(value).toBe(item.expected);
			}),
		);
}
function itShouldHaveDisabledState(
	items: TestFormItem<ClearCutForm>[],
	section: SectionForm,
	state: boolean,
	connectedUser?: User,
) {
	return items
		.filter(
			(item) => item.renderConditions.length === 0 && item.type !== "fixed",
		)
		.map((item) => {
			it(`should display the ${item.type} for "${
				item.label ?? item.name
			}", its label, and it should be ${
				state ? "disabled" : "enabled"
			}`, async () => {
				const { user } = renderApp({
					route: "/clear-cuts/$clearCutId",
					params: { $clearCutId: "ABC" },
					user: connectedUser,
				});
				await openAccordion(section, user);
				const field = formField<ClearCutForm, unknown>({
					user,
					item: item,
				}) as FieldInput;
				field.expectDisabledState(state);
			});
		});
}

async function openAccordion(section: SectionForm, user: UserEvent) {
	const accordionButton = await screen.findByText(section.name, {
		selector: "button",
	});
	await user.click(accordionButton);
	return accordionButton;
}
