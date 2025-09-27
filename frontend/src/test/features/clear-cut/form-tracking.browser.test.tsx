import { screen } from "@testing-library/react";
import { beforeEach, describe, it } from "vitest";
import { worker } from "@/mocks/browser";
import { mockClearCutReportResponse } from "@/mocks/clear-cuts";
import { mockClearCutFormsResponse } from "@/mocks/clear-cuts-forms";
import { volunteerMock } from "@/mocks/users";
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
	});
});
