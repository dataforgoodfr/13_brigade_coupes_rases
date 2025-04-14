import { LayoutProvider } from "@/features/clear-cut/components/Layout.context";
import { AsideList } from "@/features/clear-cut/components/list/AsideList";
import { MobileLayout } from "@/features/clear-cut/components/MobileLayout";
import { useBreakpoint } from "@/shared/hooks/breakpoint";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_clear-cuts/clear-cuts/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { breakpoint } = useBreakpoint();
	return (
		<LayoutProvider>
			{breakpoint === "mobile" ? (
				<MobileLayout />
			) : (
				<div className="sm:flex hidden w-1/4">
					<AsideList />
				</div>
			)}
		</LayoutProvider>
	);
}
