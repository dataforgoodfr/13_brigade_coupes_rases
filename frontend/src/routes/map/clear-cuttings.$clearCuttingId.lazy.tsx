import { AsideForm } from "@/features/clear-cutting/components/Form";
import { createLazyFileRoute, useParams } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/map/clear-cuttings/$clearCuttingId")(
	{
		component: RouteComponent,
	},
);

function RouteComponent() {
	const params = useParams({ strict: false });

	return <AsideForm clearCuttingId={params.clearCuttingId} />;
}
