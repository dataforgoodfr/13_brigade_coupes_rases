import { AsideForm } from "@/features/clear-cutting/components/AsideForm";
import { useGetClearCutting } from "@/features/clear-cutting/store/clear-cuttings-slice";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute(
	"/_clear-cuttings/clear-cuttings/$clearCuttingId",
)({
	component: RouteComponent,
});

function RouteComponent() {
	const params = Route.useParams();
	useGetClearCutting(params.clearCuttingId);
	return <AsideForm />;
}
