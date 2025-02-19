import { InteractiveMap } from "@/features/clear-cutting/components/map/InteractiveMap";
import { MapSidebar } from "@/features/clear-cutting/components/map/MapSidebar";
import { AppLayout } from "@/shared/components/AppLayout";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/clear-cuttings/map")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AppLayout sideBar={<MapSidebar />}>
			<InteractiveMap />
		</AppLayout>
	);
}
