import { createFileRoute, redirect } from "@tanstack/react-router"
import { isUndefined } from "es-toolkit"
import { useEffect } from "react"
import { z } from "zod"

import { Register } from "@/features/user/components/Register"
import { useConnectedMe } from "@/features/user/store/me.slice"

export const Route = createFileRoute("/register")({
	validateSearch: z.object({
		redirect: z.string().optional().catch("")
	}),
	beforeLoad: ({ context, search }) => {
		if (context.auth?.isAuthenticated) {
			throw redirect({ to: search.redirect || "/" })
		}
	},
	component: RouteComponent
})

function RouteComponent() {
	const navigate = Route.useNavigate()
	const loggedUser = useConnectedMe()
	const { redirect: redirectParam } = Route.useSearch()

	useEffect(() => {
		const doRedirect = async () => {
			if (isUndefined(loggedUser)) {
				return
			}
			await navigate({ to: redirectParam || "/" })
		}
		doRedirect()
	}, [loggedUser, navigate, redirectParam])

	if (loggedUser !== undefined) {
		return null
	}

	return <Register />
}
