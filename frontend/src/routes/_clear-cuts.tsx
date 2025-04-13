import { InteractiveMap } from "@/features/clear-cut/components/map/InteractiveMap";
import { MapProvider } from "@/features/clear-cut/components/map/Map.context";
import { useGetClearCuts } from "@/features/clear-cut/store/clear-cuts-slice";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_clear-cuts")({
	component: RouteComponent,
});

function RouteComponent() {
	useGetClearCuts();
	return (
		<MapProvider>
			<InteractiveMap />
			<Outlet />
		</MapProvider>
	);
}
