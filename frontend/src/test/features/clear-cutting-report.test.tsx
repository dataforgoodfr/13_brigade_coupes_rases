import { mockClearCutting } from "@/mocks/clear-cuttings";
import { server } from "@/test/mocks/server";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import { describe, it } from "vitest";

describe("Clear cutting report", () => {
	it("should display title", async () => {
		server.use(
			mockClearCutting({
				city: "Paris",
				last_cut_date: "2025-03-19",
			}),
		);
		renderApp({
			route: "/clear-cuttings/$clearCuttingId",
			params: { $clearCuttingId: "ABC" },
		});

		await screen.findByText("PARIS - 19/03/2025");
	});
});
