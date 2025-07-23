import { loginForm } from "@/test/page-object/login";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import { describe, it } from "vitest";

describe("Administration", () => {
	it("should see administration button if administrator", async () => {
		const { user } = renderApp({ route: "/login" });
		await loginForm({ user }).logAdministrator();
		await user.click(await screen.findByTitle("Administration"));
	});
});
