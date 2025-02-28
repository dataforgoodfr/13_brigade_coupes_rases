import { InteractiveMap } from "@/features/clear-cutting/components/map/InteractiveMap";
import { MapProvider } from "@/features/clear-cutting/components/map/Map.context";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_clear-cuttings")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<MapProvider>
			<InteractiveMap />
			<Outlet />
		</MapProvider>
	);
}
