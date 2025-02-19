import { handlers } from "@/mocks/handlers";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import { beforeEach, describe, it } from "vitest";
describe("Clear cuttings list", () => {
	beforeEach(() => {
		setupServer(...handlers);
	});
	it("should render list page", async () => {
		const { user } = await renderApp({});
		const link = screen.getByText("Coupes rases");
		await user.click(link);
		await screen.findByText("Année de coupe");
	});
});
