import { Login } from "@/features/user/components/Login";
import { selectLoggedUser } from "@/features/user/store/user.slice";
import { AppLayout } from "@/shared/components/AppLayout";
import { useAppSelector } from "@/shared/hooks/store";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

export const Route = createFileRoute("/login")({
	validateSearch: z.object({
		redirect: z.string().optional().catch(""),
	}),
	beforeLoad: ({ context, search }) => {
		if (context.auth?.isAuthenticated) {
			throw redirect({ to: search.redirect || "" });
		}
	},
	component: RouteComponent,
});
function RouteComponent() {
	const navigate = Route.useNavigate();
	const loggedUser = useAppSelector(selectLoggedUser);

	useEffect(() => {
		const redirect = async () => {
			if (loggedUser === undefined) {
				return;
			}
			await navigate({ to: "/" });
		};
		redirect();
	}, [loggedUser, navigate]);
	return (
		<AppLayout>
			{/* <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-sm"> */}
			<Login />
			{/* </div> */}
			{/* </div> */}
		</AppLayout>
	);
}
