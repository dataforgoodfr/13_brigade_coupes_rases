import { loginForm } from "@/test/page-object/login";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Login", () => {
	it("should log user", async () => {
		const { user } = renderApp({ route: "/login" });
		await loginForm({ user }).logVolunteer();

		const dropdown = screen.findByTestId("dropdown-menu-login");
		expect(dropdown).not.toBeNull();
		expect(dropdown).toBeTruthy();
	});
});
