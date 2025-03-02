import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AdvancedFilters } from "@/features/clear-cutting/components/filters/AdvancedFilters";
import { ClearCuttingItem } from "@/features/clear-cutting/components/list/ClearCuttingItem";
import { selectClearCuttings } from "@/features/clear-cutting/store/clear-cuttings-slice";
import { IconButton } from "@/shared/components/button/Button";
import { useAppSelector } from "@/shared/hooks/store";
import { Filter } from "lucide-react";

export function AsideList() {
	const { value } = useAppSelector(selectClearCuttings);

	return (
		<div className="flex flex-col h-full lg:inset-y-0 lg:z-50 lg:flex lg:w-190 lg:flex-col">
			<Collapsible>
				<div className="flex justify-between  items-center mt-14 border-b-1 border-zinc-200 px-3 py-2">
					<h1 className="text-2xl 2xl:text-4xl/6  text-secondary text-start font-semibold font-poppins  ">
						COUPES RASES
					</h1>
					<CollapsibleTrigger asChild>
						<IconButton
							variant="outline"
							className="border-primary text-primary"
							icon={<Filter />}
							position="end"
						>
							Filtres
						</IconButton>
					</CollapsibleTrigger>
				</div>
				<CollapsibleContent>
					<AdvancedFilters className="mt-6 px-5" />
				</CollapsibleContent>
			</Collapsible>

			<div className=" px-5 overflow-auto">
				<ul className="flex flex-col gap-6  mt-6 ">
					{value?.clearCuttingPreviews.map((preview) => (
						<ClearCuttingItem key={preview.id} {...preview} />
					))}
				</ul>
			</div>
		</div>
	);
}
