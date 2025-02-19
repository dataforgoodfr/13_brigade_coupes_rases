import { volunteerMock } from "@/test/mocks/user";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import { describe, it } from "vitest";
describe("Clear cuttings list", () => {
	it("should render list page", async () => {
		renderApp({
			user: volunteerMock,
			route: "/clear-cuttings/map",
		});
		await screen.findByText("Année de coupe");
	});
});
