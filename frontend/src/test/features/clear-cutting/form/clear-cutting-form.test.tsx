import { legalKey } from "@/features/clear-cutting/components/form/sections/LegalSection";
import { mockClearCutting } from "@/mocks/clear-cuttings";
import { server } from "@/test/mocks/server";
import { renderApp } from "@/test/renderApp";
import { ic } from "@/test/utils";
import { screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

describe("Clear cutting report", () => {
	beforeAll(() => {
		server.use(
			mockClearCutting({
				city: "Paris",
				last_cut_date: "2024-03-19",
				onSiteDate: "2024-03-19T14:26:30.789Z",
				weather: "Nuageux",
				standTypeAndSilviculturalSystemBCC: "Epicéa",
				waterCourseOrWetlandPresence: "Présence de cours d'eau",
				soilState: "Sol en mauvais état",
			}),
		);
		renderApp({
			route: "/clear-cuttings/$clearCuttingId",
			params: { $clearCuttingId: "ABC" },
		});
	});

	it("should display title", async () => {
		const title = await screen.findByRole("heading", { level: 1 });
		expect(title).toHaveTextContent(/PARIS/i);
	});

	it("should display report date", async () => {
		await screen.findByText(new Date().toLocaleDateString());
	});

	it(`should not display "${legalKey.name}" section when there isn't a user connected`, async () => {
		expect(await screen.queryByText(ic(legalKey.name))).not.toBeInTheDocument();
	});
});
