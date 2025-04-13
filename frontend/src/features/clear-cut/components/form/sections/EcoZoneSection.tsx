import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import type { FormType } from "@/shared/components/form/Form";
import type { SectionForm, SectionFormItem } from "../types";

export const ecoZoneKey: SectionForm = {
	name: "Zonnages écologiques",
	className: "flex flex-col gap-4",
};

export const ecoZoneValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "isNatura2000",
		label: "Coupe au sein d'une zone Natura 2000 ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "natura2000Zone",
		type: "customized",
		renderConditions: ["isNatura2000"],
		customizeRender: (form: FormType<ClearCutForm>, key: string | number) => {
			return (
				<p key={key}>
					{`${form.getValues("natura2000Zone.id")} ${form.getValues("natura2000Zone.name")}`}
				</p>
			);
		},
	},
	{
		name: "isOtherEcoZone",
		label: "Coupe au sein d'autres zone écologiques ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "ecoZoneType",
		label: "Type de zonages écologiques",
		type: "textArea",
		renderConditions: ["isOtherEcoZone"],
	},
	{
		name: "isNearEcoZone",
		label: "Zonages écologiques à proximité ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "nearEcoZoneType",
		label: "Type de zonages écologiques a proximité",
		type: "textArea",
		renderConditions: ["isNearEcoZone"],
	},
	{
		name: "protectedSpeciesOnZone",
		label: "Espèces protégées sur la zone (bibliographie)",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "protectedSpeciesHabitatOnZone",
		label: "Habitat d'espèces protégées sur la zone (bibliographie)",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "isDDT",
		label:
			"Demande DDT faite sur la réalisation d'une évaluation d'incidence ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "byWho",
		label: "Par qui ?",
		type: "textArea",
		renderConditions: ["isDDT"],
	},
];
