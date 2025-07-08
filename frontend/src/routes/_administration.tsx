import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_administration")({
	beforeLoad: async ({ context, location }) => {
		// If not authenticated, redirect to login with redirect param
		if (!context?.auth?.isAuthenticated) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}
		// If authenticated but not admin, redirect to home (prevents infinite loop)
		if (!context?.auth?.isAdmin) {
			throw redirect({
				to: "/",
			});
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
