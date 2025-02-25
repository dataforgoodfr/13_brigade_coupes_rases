import { AsideForm } from "@/features/clear-cutting/components/AsideForm";
import { createLazyFileRoute, useParams } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/map/$clearCuttingId")({
	component: RouteComponent,
});

function RouteComponent() {
	const params = useParams({ strict: false });

	return <AsideForm clearCuttingId={params.clearCuttingId} />;
}
