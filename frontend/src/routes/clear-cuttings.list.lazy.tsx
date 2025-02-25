import { AsideList } from "@/features/clear-cutting/components/AsideList";
import { AppLayout } from "@/shared/components/AppLayout";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/clear-cuttings/list")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AppLayout>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<AsideList />
			</div>
		</AppLayout>
	);
}
