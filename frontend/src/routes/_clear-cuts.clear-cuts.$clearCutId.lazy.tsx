import { createLazyFileRoute } from "@tanstack/react-router"

import { AsideForm } from "@/features/clear-cut/components/form/AsideForm"
import { useBreakpoint } from "@/shared/hooks/breakpoint"

export const Route = createLazyFileRoute("/_clear-cuts/clear-cuts/$clearCutId")(
	{
		component: RouteComponent
	}
)

function RouteComponent() {
	const { breakpoint } = useBreakpoint()
	const params = Route.useParams()
	return (
		<>
			{breakpoint === "mobile" ? (
				<AsideForm clearCutId={params.clearCutId} mobile />
			) : (
				<div className="sm:flex hidden xxl:w-1/4 w-3/4 lg:w-1/3 min-w-140">
					<AsideForm clearCutId={params.clearCutId} />
				</div>
			)}
		</>
	)
}
