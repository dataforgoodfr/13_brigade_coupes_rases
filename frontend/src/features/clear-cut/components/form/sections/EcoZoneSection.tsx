import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts";
import type { FormType } from "@/shared/form/types";
import type { SectionForm, SectionFormItem } from "../types";

export const ecoZoneKey: SectionForm = {
	name: "Zonnages écologiques",
	className: "flex flex-col gap-4",
};

export const ecoZoneValue: SectionFormItem<ClearCutFormInput>[] = [
	{
		name: "hasEcologicalZonings",
		label: "Coupe au sein d'une zone Natura 2000 ?",
		type: "switch",
		renderConditions: [],
		disabled: true,
	},
	{
		name: "ecologicalZonings",
		type: "customized",
		renderConditions: ["hasEcologicalZonings"],
		customizeRender: (
			_form: FormType<ClearCutFormInput>,
			_key: string | number,
		) => {
			// const zones = form
			// 	.getValues("clear_cuts")
			// 	.flatMap((c) => c.ecologicalZonings);
			// if (zones.length === 0) {
			// 	return (
			// 		<p key={key} className="text-muted-foreground">
			// 			Aucune zone Natura 2000 détectée
			// 		</p>
			// 	);
			// }
			return (
				<>
					{/* {uniqBy(zones, (z) => z.id).map((z) => (
						<p key={z.id}>
							${z.id} ${z.name}
						</p>
					))} */}
				</>
			);
		},
	},
	{
		name: "hasOtherEcologicalZone",
		label: "Coupe au sein d'autres zone écologiques ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "otherEcologicalZoneType",
		label: "Type de zonages écologiques",
		type: "textArea",
		renderConditions: ["hasNearbyEcologicalZone"],
	},
	{
		name: "hasNearbyEcologicalZone",
		label: "Zonages écologiques à proximité ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "nearbyEcologicalZoneType",
		label: "Type de zonages écologiques a proximité",
		type: "textArea",
		renderConditions: ["hasNearbyEcologicalZone"],
	},
	{
		name: "protectedSpecies",
		label: "Espèces protégées sur la zone (bibliographie)",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "protectedHabitats",
		label: "Habitat d'espèces protégées sur la zone (bibliographie)",
		type: "textArea",
		renderConditions: [],
	},
	{
		name: "hasDdtRequest",
		label:
			"Demande DDT faite sur la réalisation d'une évaluation d'incidence ?",
		type: "switch",
		renderConditions: [],
	},
	{
		name: "ddtRequestOwner",
		label: "Par qui ?",
		type: "textArea",
		renderConditions: ["hasDdtRequest"],
	},
];
