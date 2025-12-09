import { createLazyFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/")({
	component: RouteComponent
})

function RouteComponent() {
	return <Navigate to="/clear-cuts" />
}
