import { volunteerMock } from "@/test/mocks/user";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
describe("Clear cuttings list", () => {
	it("should render list page", async () => {
		renderApp({
			user: volunteerMock,
			route: "/map/clear-cuttings",
		});
		const ul = screen.findByTestId("clear-cutting-list");
		expect(ul).not.toBeNull();
		expect(ul).toBeTruthy();
	});
});
