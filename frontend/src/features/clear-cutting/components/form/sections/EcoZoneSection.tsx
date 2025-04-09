import type { ClearCutForm } from "@/features/clear-cutting/store/clear-cuttings";
import type { FormType } from "@/shared/components/form/Form";
import { FormItemType, type SectionForm, type SectionFormItem } from "../types";

export const ecoZoneKey: SectionForm = {
	name: "Zonnages écologiques",
	className: "flex flex-col gap-4",
};

export const ecoZoneValue: SectionFormItem<ClearCutForm>[] = [
	{
		name: "isNatura2000",
		label: "Coupe au sein d'une zone Natura 2000 ?",
		type: FormItemType.Switch,
		renderConditions: [],
	},
	{
		name: "natura2000Zone",
		type: FormItemType.Customized,
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
		type: FormItemType.Switch,
		renderConditions: [],
	},
	{
		name: "ecoZoneType",
		label: "Type de zonages écologiques",
		type: FormItemType.TextArea,
		renderConditions: ["isOtherEcoZone"],
	},
	{
		name: "isNearEcoZone",
		label: "Zonages écologiques à proximité ?",
		type: FormItemType.Switch,
		renderConditions: [],
	},
	{
		name: "nearEcoZoneType",
		label: "Type de zonages écologiques a proximité",
		type: FormItemType.TextArea,
		renderConditions: ["isNearEcoZone"],
	},
	{
		name: "protectedSpeciesOnZone",
		label: "Espèces protégées sur la zone (bibliographie)",
		type: FormItemType.TextArea,
		renderConditions: [],
	},
	{
		name: "protectedSpeciesHabitatOnZone",
		label: "Habitat d'espèces protégées sur la zone (bibliographie)",
		type: FormItemType.TextArea,
		renderConditions: [],
	},
	{
		name: "isDDT",
		label:
			"Demande DDT faite sur la réalisation d'une évaluation d'incidence ?",
		type: FormItemType.Switch,
		renderConditions: [],
	},
	{
		name: "byWho",
		label: "Par qui ?",
		type: FormItemType.TextArea,
		renderConditions: ["isDDT"],
	},
];
