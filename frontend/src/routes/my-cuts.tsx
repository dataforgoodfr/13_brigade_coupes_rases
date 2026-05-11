import { createFileRoute, redirect } from "@tanstack/react-router"

import { MyCuts } from "@/features/clear-cut/components/MyCuts"

export const Route = createFileRoute("/my-cuts")({
	beforeLoad: ({ context }) => {
		if (!context.auth?.isAuthenticated) {
			throw redirect({ to: "/login" })
		}
	},
	component: RouteComponent
})

function RouteComponent() {
	return <MyCuts />
}
