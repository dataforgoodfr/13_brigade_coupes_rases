import type { ClearCutForm } from "@/features/clear-cutting/store/clear-cuttings";
import { FormItemType, type SectionForm, type SectionFormItem } from "../types";

export const generalInfoKey: SectionForm = {
	name: "Informations générales",
	className: "grid grid-cols-2 gap-2",
};

export const generalInfoValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "updated_at",
		transformValue: (val: unknown) =>
			new Date(val as string).toLocaleDateString(),
		label: "Date de signalement",
		type: FormItemType.Fixed,
		renderConditions: [],
	},
	{
		name: "city",
		label: "Commune",
		type: FormItemType.Fixed,
		renderConditions: [],
	},
	{
		name: "department.name",
		label: "Département",
		type: FormItemType.Fixed,
		renderConditions: [],
	},
	{
		name: "average_location.coordinates.0",
		label: "Latitude",
		type: FormItemType.Fixed,
		renderConditions: [],
	},
	{
		name: "average_location.coordinates.1",
		label: "Longitude",
		type: FormItemType.Fixed,
		renderConditions: [],
	},
	{
		name: "last_cut_date",
		label: "Date de la coupe",
		type: FormItemType.Fixed,
		renderConditions: [],
	},
	{
		name: "total_area_hectare",
		label: "Taille de la coupe",
		type: FormItemType.Fixed,
		renderConditions: [],
		transformValue: (val: unknown) => `${val} ha`,
	},
	{
		name: "slope_area_ratio_percentage",
		label: "Pourcentage de pente",
		type: FormItemType.Fixed,
		renderConditions: [],
		transformValue: (val: unknown) => `${val}%`,
	},
];
