import { AsideList } from "@/features/clear-cutting/components/AsideList";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/map/clear-cuttings")({
	component: RouteComponent,
});

function RouteComponent() {
	return <AsideList />;
}
