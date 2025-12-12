import { createLazyFileRoute } from "@tanstack/react-router"

import { useLayout } from "@/features/clear-cut/components/Layout.context"
import { AsideList } from "@/features/clear-cut/components/list/AsideList"
import { selectClearCuts } from "@/features/clear-cut/store/clear-cuts-slice"
import { cn } from "@/lib/utils"
import { Loading } from "@/shared/components/Loading"
import { useBreakpoint } from "@/shared/hooks/breakpoint"
import { useAppSelector } from "@/shared/hooks/store"

export const Route = createLazyFileRoute("/_clear-cuts/clear-cuts/")({
	component: RouteComponent
})

function RouteComponent() {
	const { breakpoint } = useBreakpoint()
	const { status } = useAppSelector(selectClearCuts)
	const { layout } = useLayout()
	return (
		<>
			{status === "loading" && <Loading className="absolute top-0 z-100" />}
			{breakpoint === "mobile" ? (
				<div className="flex h-full grow ">
					<AsideList mobile />
				</div>
			) : (
				<div
					className={cn("xxl:w-1/4 w-3/4 lg:w-200", {
						hidden: layout !== "list"
					})}
				>
					<AsideList />
				</div>
			)}
		</>
	)
}
