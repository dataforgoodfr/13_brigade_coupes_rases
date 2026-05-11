import { createFileRoute, redirect } from "@tanstack/react-router"
import { isUndefined } from "es-toolkit"
import { useEffect } from "react"

import { ForgotPassword } from "@/features/user/components/ForgotPassword"
import { useConnectedMe } from "@/features/user/store/me.slice"

export const Route = createFileRoute("/forgot-password")({
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

	return <ForgotPassword />
}
