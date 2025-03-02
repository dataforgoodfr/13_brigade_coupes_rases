import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_administration")({
	beforeLoad: async ({ context, location }) => {
		if (!context?.auth?.isAdmin) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
