import { createFileRoute, redirect } from "@tanstack/react-router"
import { isUndefined } from "es-toolkit"
import { useEffect } from "react"
import { z } from "zod"

import { ResetPassword } from "@/features/user/components/ResetPassword"
import { useConnectedMe } from "@/features/user/store/me.slice"

export const Route = createFileRoute("/reset-password")({
	validateSearch: z.object({
		token: z.string()
	}),
	beforeLoad: ({ context }) => {
		if (context.auth?.isAuthenticated) {
			throw redirect({ to: "/" })
		}
	},
	component: RouteComponent
})

function RouteComponent() {
	const navigate = Route.useNavigate()
	const loggedUser = useConnectedMe()
	const { token } = Route.useSearch()

	useEffect(() => {
		const doRedirect = async () => {
			if (isUndefined(loggedUser)) {
				return
			}
			await navigate({ to: "/" })
		}
		doRedirect()
	}, [loggedUser, navigate])

	if (loggedUser !== undefined) {
		return null
	}

	return <ResetPassword token={token} />
}
