import { legalKey } from "@/features/clear-cutting/components/form/sections/LegalSection";
import { generateAddressMock, mockClearCutting } from "@/mocks/clear-cuttings";
import { server } from "@/test/mocks/server";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { ic } from "@/test/utils";

describe("Clear cutting report", () => {
	beforeAll(() => {
		server.use(
			mockClearCutting({
				address: generateAddressMock({ city: "Paris" }),
				cutYear: 2024,
				reportDate: new Date().toISOString()
			}),
		);
		renderApp({
			route: "/clear-cuttings/$clearCuttingId",
			params: { $clearCuttingId: "ABC" },
		});
	});

	it("should display title", async () => {
		const title = await screen.findByRole("heading", {level: 1});
		expect(title).toHaveTextContent(/PARIS/i);
	});

	it("should display report date", async () => {
		await screen.findByText(new Date().toLocaleDateString());
	});

	it(`should not display "${legalKey.name}" section when there isn't a user connected`,async () => {
		expect(await screen.queryByText(ic(legalKey.name))).not.toBeInTheDocument();
	})
});
