import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import { FormattedDate, FormattedNumber } from "react-intl";
import type { SectionForm, SectionFormItem } from "../types";

export const generalInfoKey: SectionForm = {
	name: "Informations générales",
	className: "grid grid-cols-2 gap-2",
};

export const generalInfoValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "report.updatedAt",
		transformValue: ({ value }) => <FormattedDate value={value as string} />,
		label: "Date de signalement",
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "report.city",
		label: "Commune",
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "report.department.name",
		label: "Département",
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "report.averageLocation.coordinates.0",
		label: "Latitude",
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "report.averageLocation.coordinates.1",
		label: "Longitude",
		type: "fixed",
		renderConditions: [],
	},
	{
		name: "report.lastCutDate",
		label: "Date de la coupe",
		type: "fixed",
		renderConditions: [],
		transformValue: ({ value }) =>
			value !== undefined ? (
				<FormattedDate value={value as string} />
			) : undefined,
	},
	{
		name: "report.totalAreaHectare",
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
		name: "report.slopeAreaHectare",
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
