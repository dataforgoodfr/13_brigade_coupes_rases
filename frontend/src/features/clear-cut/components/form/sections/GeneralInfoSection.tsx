import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import type { SectionForm, SectionFormItem } from "../types";

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
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "city",
		label: "Commune",
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "department.name",
		label: "Département",
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "average_location.coordinates.0",
		label: "Latitude",
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "average_location.coordinates.1",
		label: "Longitude",
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "last_cut_date",
		label: "Date de la coupe",
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "total_area_hectare",
		label: "Taille de la coupe",
		type: "fixed",
		renderConditions: [],
		transformValue: (val: unknown) => `${val} ha`,
	},
	{
		name: "slope_area_ratio_percentage",
		label: "Pourcentage de pente",
		type: "fixed",
		renderConditions: [],
		transformValue: (val: unknown) => `${val}%`,
	},
];
