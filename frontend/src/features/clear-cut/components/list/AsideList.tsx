import { Filter, MapIcon } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AdvancedFilters } from "@/features/clear-cut/components/filters/AdvancedFilters";
import { useLayout } from "@/features/clear-cut/components/Layout.context";
import { ClearCutItem } from "@/features/clear-cut/components/list/ClearCutItem";
import { selectClearCuts } from "@/features/clear-cut/store/clear-cuts-slice";
import { IconButton } from "@/shared/components/button/Button";
import { Title } from "@/shared/components/typo/Title";
import { useAppSelector } from "@/shared/hooks/store";

export function AsideList() {
	const { value } = useAppSelector(selectClearCuts);
	const { setLayout } = useLayout();
	return (
		<div className="flex flex-col w-full">
			<Collapsible>
				<div className="flex justify-between  items-center mt-5 sm:mt-14 border-b-1 border-zinc-200 px-3 py-2">
					<Title className="text-primary">COUPES RASES</Title>
					<IconButton
						variant="zinc"
						className="sm:hidden"
						onClick={() => setLayout("map")}
						icon={<MapIcon />}
						title="Afficher la carte"
						position="start"
					/>
					<CollapsibleTrigger asChild>
						<IconButton variant="zinc" icon={<Filter />} position="start">
							Filtres
						</IconButton>
					</CollapsibleTrigger>
				</div>
				<CollapsibleContent>
					<AdvancedFilters className="mt-6 sm:px-3 px-1" />
				</CollapsibleContent>
			</Collapsible>

			<div className="overflow-auto">
				<ul className="flex flex-col gap-6  mt-6 ">
					{value?.previews.map((preview) => (
						<ClearCutItem key={preview.id} {...preview} />
					))}
				</ul>
			</div>
		</div>
	);
}
