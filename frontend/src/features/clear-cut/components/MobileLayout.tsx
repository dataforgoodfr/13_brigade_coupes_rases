import { useLayout } from "@/features/clear-cut/components/Layout.context";
import { AsideList } from "@/features/clear-cut/components/list/AsideList";
import { InteractiveMap } from "@/features/clear-cut/components/map/InteractiveMap";

export function MobileLayout() {
	const { layout } = useLayout();
	return (
		<div className="sm:hidden flex h-full grow ">
			{layout === "list" ? <AsideList /> : <InteractiveMap />}
		</div>
	);
}
