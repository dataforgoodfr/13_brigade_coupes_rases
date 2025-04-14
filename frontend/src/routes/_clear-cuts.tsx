import { InteractiveMap } from "@/features/clear-cut/components/map/InteractiveMap";
import { MapProvider } from "@/features/clear-cut/components/map/Map.context";
import { useGetClearCuts } from "@/features/clear-cut/store/clear-cuts-slice";
import { useBreakpoint } from "@/shared/hooks/breakpoint";

import { Outlet, createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_clear-cuts")({
	component: RouteComponent,
});

function RouteComponent() {
	useGetClearCuts();
	const { breakpoint } = useBreakpoint();

	return (
		<>
			{breakpoint === "all" ? (
				<div className="hidden sm:flex grow">
					<InteractiveMap />
					<Outlet />
				</div>
			) : (
				<div className="sm:hidden flex grow ">
					<Outlet />
				</div>
			)}
		</>
	);
}
