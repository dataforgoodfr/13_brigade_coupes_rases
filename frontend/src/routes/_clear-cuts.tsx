import { createFileRoute, Outlet } from "@tanstack/react-router"

import { InteractiveMap } from "@/features/clear-cut/components/map/InteractiveMap"
import { useGetClearCuts } from "@/features/clear-cut/store/clear-cuts-slice"
export const Route = createFileRoute("/_clear-cuts")({
	component: RouteComponent
})

function RouteComponent() {
	useGetClearCuts()

	return (
		<div className="flex grow">
			<InteractiveMap />
			<Outlet />
		</div>
	)
}
