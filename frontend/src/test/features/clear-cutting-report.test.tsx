import { generateAddressMock, mockClearCutting } from "@/mocks/clear-cuttings";
import { server } from "@/test/mocks/server";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import { describe, it } from "vitest";

describe("Clear cutting report", () => {
	it("should display title", async () => {
		server.use(
			mockClearCutting({
				address: generateAddressMock({ city: "Paris" }),
				cutYear: 2024,
			}),
		);
		renderApp({
			route: "/clear-cuttings/$clearCuttingId",
			params: { $clearCuttingId: "ABC" },
		});

		await screen.findByText("PARIS - 2024");
	});
});
