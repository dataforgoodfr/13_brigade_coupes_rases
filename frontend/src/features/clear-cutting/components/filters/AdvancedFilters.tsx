import { Switch } from "@/components/ui/switch";
import { StatusWithLabel } from "@/features/clear-cutting/components/StatusWithLabel";
import {
	filtersSlice,
	getFiltersThunk,
	selectAreaPresetsHectare,
	selectCutYears,
	selectDepartments,
	selectEcologicalZoning,
	selectExcessiveSlop,
	selectFavorite,
	selectStatuses,
} from "@/features/clear-cutting/store/filters.slice";
import { ComboboxFilter } from "@/shared/components/select/ComboboxFilter";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	type NamedId,
	type SelectableItem,
	selectableItemToString,
	useEnhancedItems,
} from "@/shared/items";
import clsx from "clsx";
import { type FC, type PropsWithChildren, useEffect } from "react";

const namedIdTranslator = ({ item }: SelectableItem<NamedId>) =>
	item.name.toString();

interface Props {
	className?: string;
}
const CUT_YEARS = {
	label: "Années de coupe",
	id: "cutYears",
};
const DEPARTMENTS = {
	id: "departments",
	label: "Départements",
};
const AREA = {
	id: "area",
	label: "Superficie",
};
const STATUS = {
	id: "status",
	label: "Etat",
};
const ECOLOGICAL_ZONING = {
	id: "ecologicalZoning",
	label: "Zone protégée",
};
const EXCESSIVE_SLOP = {
	id: "excessiveSlop",
	label: "Pente excessive",
};
const FAVORITE = {
	id: "favorite",
	label: "Favoris",
};
export function AdvancedFilters({ className }: Props) {
	const dispatch = useAppDispatch();
	const cutYears = useEnhancedItems(
		useAppSelector(selectCutYears),
		selectableItemToString,
		selectableItemToString,
	);
	const departments = useEnhancedItems(
		useAppSelector(selectDepartments),
		namedIdTranslator,
		namedIdTranslator,
	);
	const areaPresets = useEnhancedItems(
		useAppSelector(selectAreaPresetsHectare),
		(area) => `${area.item} hectares`,
		selectableItemToString,
	);
	const statuses = useEnhancedItems(
		useAppSelector(selectStatuses),
		(status) => <StatusWithLabel status={status.item.name} />,
		selectableItemToString,
	);
	const excessiveSlop = useAppSelector(selectExcessiveSlop);
	const favorite = useAppSelector(selectFavorite);
	const ecologicalZoning = useAppSelector(selectEcologicalZoning);

	useEffect(() => {
		dispatch(getFiltersThunk());
	}, [dispatch]);
	return (
		<div className={clsx("flex flex-col gap-2 py-3", className)}>
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
			<FieldWrapper>
				<label htmlFor={CUT_YEARS.id}>{CUT_YEARS.label}</label>
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
			</FieldWrapper>

			<FieldWrapper>
				<label htmlFor={AREA.id}>{AREA.label}</label>
				<ComboboxFilter
					type="multiple"
					countPreview
					hasInput
					hasReset
					id={AREA.id}
					label={AREA.label}
					items={areaPresets}
					changeOnClose={(areaPresets) =>
						dispatch(filtersSlice.actions.setAreas(areaPresets))
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
			<div className="flex gap-4">
				<div className=" flex flex-col gap-1">
					<label htmlFor={ECOLOGICAL_ZONING.id}>
						{ECOLOGICAL_ZONING.label}
					</label>
					<Switch
						id={ECOLOGICAL_ZONING.id}
						checked={ecologicalZoning}
						onCheckedChange={(isChecked) =>
							dispatch(filtersSlice.actions.setEcologicalZoning(isChecked))
						}
					/>
				</div>
				<div className=" flex flex-col gap-1">
					<label htmlFor={EXCESSIVE_SLOP.id}>{EXCESSIVE_SLOP.label}</label>
					<Switch
						id={EXCESSIVE_SLOP.id}
						checked={excessiveSlop}
						onCheckedChange={(isChecked) =>
							dispatch(filtersSlice.actions.setExcessiveSlop(isChecked))
						}
					/>
				</div>
				<div className=" flex flex-col gap-1">
					<label htmlFor={FAVORITE.id}>{FAVORITE.label}</label>
					<Switch
						id={FAVORITE.id}
						checked={favorite}
						onCheckedChange={(isChecked) =>
							dispatch(filtersSlice.actions.setFavorite(isChecked)) 
						}
					/>
				</div>
			</div>
		</div>
	);
}

const FieldWrapper: FC<PropsWithChildren> = ({ children }) => {
	return <div className="flex w-2/3 flex-col gap-1"> {children}</div>;
};
