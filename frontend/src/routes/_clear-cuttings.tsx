import { InteractiveMap } from "@/features/clear-cutting/components/map/InteractiveMap";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_clear-cuttings")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<InteractiveMap />
			<div className="m-3 lg:inset-y-0 lg:z-50 lg:flex lg:w-200 lg:flex-col px-0.5">
				<Outlet />
			</div>
		</>
	);
}
