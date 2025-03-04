import { InteractiveMap } from "@/features/clear-cutting/components/map/InteractiveMap";
import { MapProvider } from "@/features/clear-cutting/components/map/Map.context";
import { useGetClearCuttings } from "@/features/clear-cutting/store/clear-cuttings-slice";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_clear-cuttings")({
	component: RouteComponent,
});

function RouteComponent() {
	useGetClearCuttings();
	return (
		<MapProvider>
			<InteractiveMap />
			<Outlet />
		</MapProvider>
	);
}
