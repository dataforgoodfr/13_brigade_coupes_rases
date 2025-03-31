import { AsideForm } from "@/features/clear-cutting/components/form/AsideForm";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute(
	"/_clear-cuttings/clear-cuttings/$clearCuttingId",
)({
	component: RouteComponent,
});

function RouteComponent() {
	const params = Route.useParams();
	return <AsideForm clearCuttingId={params.clearCuttingId} />;
}
