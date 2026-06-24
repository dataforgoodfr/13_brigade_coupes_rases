import { Filter, MapIcon } from "lucide-react"
import { useState } from "react"

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from "@/components/ui/collapsible"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AdvancedFilters } from "@/features/clear-cut/components/filters/AdvancedFilters"
import { useLayout } from "@/features/clear-cut/components/Layout.context"
import { ClearCutItem } from "@/features/clear-cut/components/list/ClearCutItem"
import { selectClearCuts } from "@/features/clear-cut/store/clear-cuts-slice"
import {
	filtersSlice,
	selectResetVersion,
	selectSortOrder
} from "@/features/clear-cut/store/filters.slice"
import { cn } from "@/lib/utils"
import { IconButton } from "@/shared/components/button/Button"
import { SortingButton } from "@/shared/components/button/SortingButton"
import { Title } from "@/shared/components/typo/Title"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"

export function AsideList({ mobile = false }: { mobile?: boolean }) {
	const { value } = useAppSelector(selectClearCuts)
	const { layout, setLayout } = useLayout()
	const dispatch = useAppDispatch()
	const resetVersion = useAppSelector(selectResetVersion)
	const sortOrder = useAppSelector(selectSortOrder)
	const [filtersOpen, setFiltersOpen] = useState(false)
	const isShown = layout === "list"

	const sortButton = (
		<SortingButton
			sort={sortOrder}
			onClick={() => dispatch(filtersSlice.actions.toggleSortOrder())}
		>
			<span className="hidden min-[420px]:inline">Date de coupe</span>
			<span className="min-[420px]:hidden">Date</span>
		</SortingButton>
	)

	const mapToggle = (
		<IconButton
			variant="outline"
			onClick={() => setLayout("map")}
			icon={<MapIcon />}
			title="Afficher la carte"
			position="start"
		/>
	)

	const filtersButton = (
		<IconButton
			variant="outline"
			icon={<Filter />}
			position="start"
			title="Filtres"
		>
			<span className="hidden min-[420px]:inline">Filtres</span>
		</IconButton>
	)

	const list = (
		<div className="overflow-auto">
			<ul className="flex flex-col">
				{value?.previews.map((preview) => (
					<ClearCutItem key={preview.id} {...preview} />
				))}
			</ul>
		</div>
	)

	const headerClassName =
		"flex justify-between items-center gap-2 mt-1 sm:mt-2 border-b-1 border-zinc-200 px-3 py-2"
	const containerClassName = cn("flex flex-col w-full bg-background", {
		hidden: !isShown,
		"absolute top-0 left-0 right-0 bottom-16 z-10": isShown && mobile,
		"h-auto": !(isShown && mobile)
	})

	// On mobile the filters live in a bottom sheet (more room, no inline shift);
	// on desktop they stay in an inline collapsible panel under the header.
	if (mobile) {
		return (
			<div className={containerClassName}>
				<Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
					<div className={headerClassName}>
						<Title className="text-primary truncate min-w-0 text-lg sm:text-xl">
							COUPES RASES
						</Title>
						<div className="flex gap-2 shrink-0">
							{sortButton}
							<SheetTrigger asChild>{filtersButton}</SheetTrigger>
							{mapToggle}
						</div>
					</div>
					<SheetContent title="Filtres">
						<div className="overflow-y-auto">
							<AdvancedFilters
								key={resetVersion}
								className="px-1 bg-background"
								onClose={() => setFiltersOpen(false)}
							/>
						</div>
					</SheetContent>
				</Sheet>
				{list}
			</div>
		)
	}

	return (
		<div className={containerClassName}>
			<Collapsible>
				<div className={headerClassName}>
					<Title className="text-primary truncate min-w-0 text-lg sm:text-xl">
						COUPES RASES
					</Title>
					<div className="flex gap-2 shrink-0">
						{sortButton}
						<CollapsibleTrigger asChild>{filtersButton}</CollapsibleTrigger>
						{mapToggle}
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
					<AdvancedFilters key={resetVersion} className="px-3" />
				</CollapsibleContent>
			</Collapsible>
			{list}
		</div>
	)
}
