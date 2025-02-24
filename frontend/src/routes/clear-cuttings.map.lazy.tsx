import { AsideList } from "@/features/clear-cutting/components/AsideList";
import { InteractiveMap } from "@/features/clear-cutting/components/map/InteractiveMap";
import { AppLayout } from "@/shared/components/AppLayout";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/clear-cuttings/map")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AppLayout sideBar={<AsideList />}>
			<InteractiveMap />
		</AppLayout>
	);
}
