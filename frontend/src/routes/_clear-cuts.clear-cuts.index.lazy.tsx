import { AsideList } from "@/features/clear-cut/components/list/AsideList";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_clear-cuts/clear-cuts/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <AsideList />;
}
