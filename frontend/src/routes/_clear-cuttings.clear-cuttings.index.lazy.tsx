import { AsideList } from "@/features/clear-cutting/components/list/AsideList";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_clear-cuttings/clear-cuttings/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <AsideList />;
}
