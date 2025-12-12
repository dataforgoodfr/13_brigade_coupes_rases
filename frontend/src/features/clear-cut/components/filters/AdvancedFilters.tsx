import clsx from "clsx"
import { type FC, type PropsWithChildren, useEffect } from "react"
import { FormattedDate } from "react-intl"

import { Slider } from "@/components/ui/slider"
import { StatusWithLabel } from "@/features/clear-cut/components/StatusWithLabel"
import {
	filtersSlice,
	getFiltersThunk,
	selectAreaRange,
	selectAreas,
	selectCutMonths,
	selectCutYears,
	selectDepartments,
	selectEcologicalZoning,
	selectExcessiveSlop,
	selectFavorite,
	selectStatuses
} from "@/features/clear-cut/store/filters.slice"
import { ComboboxFilter } from "@/shared/components/select/ComboboxFilter"
import { ToggleGroup } from "@/shared/components/toggle-group/ToggleGroup"
import { useDebounce } from "@/shared/hooks/debounce"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import {
	booleanSelectableToString,
	namedIdTranslator,
	selectableItemToString,
	useEnhancedItems
} from "@/shared/items"

interface Props {
	className?: string
}
const CUT_YEARS = {
	label: "Années",
	id: "cutYears"
}
const CUT_MONTHS = {
	label: "Mois",
	id: "cutMonths"
}
const DEPARTMENTS = {
	id: "departments",
	label: "Départements"
}
const AREA = {
	id: "area",
	label: "Superficie"
}
const STATUS = {
	id: "status",
	label: "Etat"
}
const ECOLOGICAL_ZONING = {
	id: "ecological_zoning",
	label: "Zone protégée"
}
const EXCESSIVE_SLOP = {
	id: "excessive_slop",
	label: "Pente excessive"
}
const FAVORITE = {
	id: "favorite",
	label: "Favoris"
}

export function AdvancedFilters({ className }: Props) {
	const dispatch = useAppDispatch()
	const cutYears = useEnhancedItems({
		items: useAppSelector(selectCutYears),
		getItemLabel: selectableItemToString,
		getItemValue: selectableItemToString
	})
	const cutMonths = useEnhancedItems({
		items: useAppSelector(selectCutMonths),
		getItemLabel: (month) => (
			<FormattedDate value={new Date(2025, month.item - 1, 1)} month="long">
				{(a) => <span className="capitalize">{a}</span>}
			</FormattedDate>
		),
		getItemValue: selectableItemToString
	})
	const departments = useEnhancedItems({
		items: useAppSelector(selectDepartments),
		getItemLabel: namedIdTranslator,
		getItemValue: namedIdTranslator
	})
	const areaRange = useAppSelector(selectAreaRange)
	const areas = useAppSelector(selectAreas)
	const statuses = useEnhancedItems({
		items: useAppSelector(selectStatuses),
		getItemLabel: (status) => <StatusWithLabel status={status.item} />,
		getItemValue: selectableItemToString
	})
	const excessive_slop = useEnhancedItems({
		items: useAppSelector(selectExcessiveSlop),
		getItemLabel: booleanSelectableToString,
		getItemValue: booleanSelectableToString
	})
	const favorite = useEnhancedItems({
		items: useAppSelector(selectFavorite),
		getItemLabel: booleanSelectableToString,
		getItemValue: booleanSelectableToString
	})
	const ecological_zoning = useEnhancedItems({
		items: useAppSelector(selectEcologicalZoning),
		getItemLabel: booleanSelectableToString,
		getItemValue: booleanSelectableToString
	})

	useEffect(() => {
		dispatch(getFiltersThunk())
	}, [dispatch])
	const [currentAreas, onAreasChanged] = useDebounce(
		areas,
		(newAreas: number[] | undefined) =>
			dispatch(
				filtersSlice.actions.setAreas(newAreas as [number, number] | undefined)
			)
	)
	return (
		<div className={clsx("flex flex-col gap-2 py-3", className)}>
			<div className="flex gap-2">
				<FieldWrapper>
					<label htmlFor={DEPARTMENTS.id}>{DEPARTMENTS.label}</label>
					<ComboboxFilter
						type="multiple"
						countPreview
						hasInput
						hasReset
						label={DEPARTMENTS.label}
						items={departments}
						changeOnClose={(departments) =>
							dispatch(filtersSlice.actions.setDepartments(departments))
						}
					/>
				</FieldWrapper>
				<div className="flex flex-col gap-1">
					<label htmlFor={CUT_MONTHS.id}>Date de coupe</label>
					<div className="flex gap-1">
						<ComboboxFilter
							type="multiple"
							countPreview
							hasInput={false}
							hasReset
							id={CUT_MONTHS.id}
							label={CUT_MONTHS.label}
							items={cutMonths}
							changeOnClose={(cutMonths) =>
								dispatch(filtersSlice.actions.setCutMonths(cutMonths))
							}
						/>
						<ComboboxFilter
							type="multiple"
							countPreview
							hasInput
							hasReset
							id={CUT_YEARS.id}
							label={CUT_YEARS.label}
							items={cutYears}
							changeOnClose={(cutYears) =>
								dispatch(filtersSlice.actions.setCutYears(cutYears))
							}
						/>
					</div>
				</div>
			</div>
			<div className="flex gap-2">
				<FieldWrapper>
					<label htmlFor={AREA.id}>
						{AREA.label} hectares{" "}
						{currentAreas && (
							<>
								({currentAreas[0]}, {currentAreas[1]})
							</>
						)}
					</label>
					<Slider
						className="my-auto"
						value={currentAreas}
						min={areaRange.min}
						max={areaRange.max}
						step={0.5}
						onValueChange={(values) =>
							onAreasChanged(values as [number, number] | undefined)
						}
					/>
				</FieldWrapper>
				<FieldWrapper>
					<label htmlFor={STATUS.id}>{STATUS.label}</label>
					<ComboboxFilter
						type="multiple"
						countPreview
						hasInput
						hasReset
						id={STATUS.id}
						label={STATUS.label}
						items={statuses}
						changeOnClose={(statuses) =>
							dispatch(filtersSlice.actions.setStatuses(statuses))
						}
					/>
				</FieldWrapper>
			</div>
			<div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
				<div className="flex flex-col gap-1">
					<label htmlFor={ECOLOGICAL_ZONING.id}>
						{ECOLOGICAL_ZONING.label}
					</label>
					<ToggleGroup
						variant="primary"
						id={ECOLOGICAL_ZONING.id}
						value={ecological_zoning}
						type="single"
						allowEmptyValue={false}
						onValueChange={(item) =>
							dispatch(filtersSlice.actions.setHasEcologicalZoning(item))
						}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor={EXCESSIVE_SLOP.id}>{EXCESSIVE_SLOP.label}</label>
					<ToggleGroup
						variant="primary"
						id={EXCESSIVE_SLOP.id}
						value={excessive_slop}
						type="single"
						allowEmptyValue={false}
						onValueChange={(item) =>
							dispatch(filtersSlice.actions.setExcessiveSlop(item))
						}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor={FAVORITE.id}>{FAVORITE.label}</label>
					<ToggleGroup
						variant="primary"
						id={FAVORITE.id}
						value={favorite}
						type="single"
						allowEmptyValue={false}
						onValueChange={(item) =>
							dispatch(filtersSlice.actions.setFavorite(item))
						}
					/>
				</div>
			</div>
		</div>
	)
}

const FieldWrapper: FC<PropsWithChildren> = ({ children }) => {
	return <div className="flex w-1/2 flex-col gap-1"> {children}</div>
}
