import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts";
import { worker } from "@/mocks/browser";
import { mockClearCutReportResponse } from "@/mocks/clear-cuts";
import { mockClearCutFormsResponse } from "@/mocks/clear-cuts-forms";
import { volunteerMock } from "@/mocks/users";
import { type FieldInput, formField } from "@/test/page-object/form-input";
import { renderApp } from "@/test/renderApp";

const reportMock = mockClearCutReportResponse({
	id: "ABC",
	affectedUser: volunteerMock,
});
const formMock = mockClearCutFormsResponse({
	reportId: reportMock.response.id,
});
describe("From tracking", () => {
	beforeEach(() => {
		worker.use(reportMock.handler, formMock.handler);
	});
	it("Should  display rollback button when current form is different from original", async () => {
		const { user } = renderApp({
			route: "/clear-cuts/$clearCutId",
			params: { $clearCutId: reportMock.response.id },
			user: volunteerMock,
		});
		const accordionButton = await screen.findByText("Terrain", {
			selector: "button",
		});
		await user.click(accordionButton);

		const field = formField<ClearCutFormInput, string | null>({
			user,
			item: {
				name: "weather",
				label: "Météo",
				type: "textArea",
				expected: formMock.response.weather,
				renderConditions: [],
			},
		}) as FieldInput<string | null, HTMLButtonElement | HTMLTextAreaElement>;
		await field.setValue("Test");
		expect(await field.findValue()).toBe("Test");
		await field.resetToOriginal();
		expect(await field.findValue()).toBe(formMock.response.weather);
	});
});
