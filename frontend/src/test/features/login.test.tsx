import { loginForm } from "@/test/page-object/login";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import { describe, it } from "vitest";

describe("Login", () => {
	it("should log user", async () => {
		const { user } = renderApp({ route: "/login" });
		await loginForm({ user }).logVolunteer();
		await screen.findByText("volunteer");
	});
});
