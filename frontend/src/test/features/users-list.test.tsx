import { loginForm } from "@/test/page-object/login";
import { renderApp } from "@/test/renderApp";
import { screen } from "@testing-library/react";
import { describe, it } from "vitest";

describe("Users list", () => {
	it("should see users list if administrator", async () => {
		const { user } = renderApp({ route: "/login" });
		await loginForm({ user }).logAdministrator();
		(await screen.findByText("Utilisateurs")).click();

		//const currentPathname = window.location.pathname;

		// TODO: tests
		//expect(currentPathname).toEqual("/users");
		//expect(screen.getByText("Liste des utilisateurs")).toBeDefined();
	});

	// it("should not see users list if volunteer", async () => {
	//   const { user, router } = renderApp({ route: "/login" });
	//   await loginForm({ user }).logVolunteer();
	//   await router.navigate({ to: "/users" });
	//   const currentPathname = window.location.pathname;
	//   expect(currentPathname).toEqual("/login");
	// });
});
