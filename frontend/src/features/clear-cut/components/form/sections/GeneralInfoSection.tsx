import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import { FormattedDate, FormattedNumber } from "react-intl";
import type { SectionForm, SectionFormItem } from "../types";

export const generalInfoKey: SectionForm = {
	name: "Informations générales",
	className: "grid grid-cols-2 gap-2",
};

export const generalInfoValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "updated_at",
		transformValue: ({ value }) => <FormattedDate value={value as string} />,
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
		transformValue: ({ value }) =>
			value !== undefined ? (
				<FormattedDate value={value as string} />
			) : undefined,
	},
	{
		name: "total_area_hectare",
		label: "Taille de la coupe",
		type: "fixed",
		renderConditions: [],
		transformValue: ({ value }) =>
			value !== undefined ? (
				<>
					<FormattedNumber value={value as number} /> ha
				</>
			) : undefined,
	},
	{
		name: "slope_area_hectare",
		label: "Pente raide (>30%)",
		type: "fixed",
		renderConditions: [],
		transformValue: ({ value }) =>
			value !== undefined ? (
				<>
					<FormattedNumber value={value as number} maximumFractionDigits={2} />{" "}
					ha
				</>
			) : undefined,
	},
];
