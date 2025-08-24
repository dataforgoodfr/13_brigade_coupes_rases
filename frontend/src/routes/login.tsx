import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { Login } from "@/features/user/components/Login";
import { useMe } from "@/features/user/store/me.slice";

// Define the login route with optional redirect parameter
export const Route = createFileRoute("/login")({
	validateSearch: z.object({
		redirect: z.string().optional().catch(""),
	}),
	// If already authenticated, redirect to the intended page or home
	beforeLoad: ({ context, search }) => {
		if (context.auth?.isAuthenticated) {
			throw redirect({ to: search.redirect || "" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const loggedUser = useMe();
	const { redirect: redirectParam } = Route.useSearch();

	// If user is logged in, redirect to the intended page or home
	useEffect(() => {
		const doRedirect = async () => {
			if (loggedUser === undefined) {
				return;
			}
			await navigate({ to: redirectParam || "/" });
		};
		doRedirect();
	}, [loggedUser, navigate, redirectParam]);

	// Prevents login page flash for authenticated users
	if (loggedUser !== undefined) {
		return null; // Prevents login page flash for authenticated users
	}

	// Show login form for unauthenticated users
	return <Login />;
}
