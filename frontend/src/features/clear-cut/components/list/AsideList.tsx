import { Filter, MapIcon } from "lucide-react"

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from "@/components/ui/collapsible"
import { AdvancedFilters } from "@/features/clear-cut/components/filters/AdvancedFilters"
import { useLayout } from "@/features/clear-cut/components/Layout.context"
import { ClearCutItem } from "@/features/clear-cut/components/list/ClearCutItem"
import { selectClearCuts } from "@/features/clear-cut/store/clear-cuts-slice"
import { cn } from "@/lib/utils"
import { IconButton } from "@/shared/components/button/Button"
import { Title } from "@/shared/components/typo/Title"
import { useAppSelector } from "@/shared/hooks/store"

export function AsideList({ mobile = false }: { mobile?: boolean }) {
	const { value } = useAppSelector(selectClearCuts)
	const { layout, setLayout } = useLayout()
	const isShown = layout === "list"

	return (
		<div
			className={cn("flex flex-col w-full bg-background", {
				hidden: !isShown,
				"absolute top-0 left-0 right-0 bottom-0 z-10": isShown && mobile,
				"h-auto": !(isShown && mobile)
			})}
		>
			<Collapsible>
				<div className="flex justify-between items-center mt-1 sm:mt-2 border-b-1 border-zinc-200 px-3 py-2">
					<Title className="text-primary">COUPES RASES</Title>
					<div className="flex gap-2">
						<IconButton
							variant="outline"
							// className="sm:hidden"
							onClick={() => setLayout("map")}
							icon={<MapIcon />}
							title="Afficher la carte"
							position="start"
						/>
						<CollapsibleTrigger asChild>
							<IconButton
								variant="outline"
								icon={<Filter />}
								position="start"
								className="[data-state=open]:bg-purple-400"
							>
								Filtres
							</IconButton>
						</CollapsibleTrigger>
					</div>
				</div>
				<CollapsibleContent
					className="border-b-1 border-zinc-200 slide-content"
					style={
						{
							"--radix-content-height":
								"var(--radix-collapsible-content-height)"
						} as React.CSSProperties
					}
				>
					<AdvancedFilters className="px-3" />
				</CollapsibleContent>
			</Collapsible>

			<div className="overflow-auto">
				<ul className="flex flex-col">
					{value?.previews.map((preview) => (
						<ClearCutItem key={preview.id} {...preview} />
					))}
				</ul>
			</div>
		</div>
	)
}
