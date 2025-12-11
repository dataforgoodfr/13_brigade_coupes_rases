import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts"

import type { SectionForm, SectionFormItem } from "../types"

export const ecoZoneKey: SectionForm = {
	name: "Zonnages écologiques",
	className: "flex flex-col gap-4"
}

export const ecoZoneValue: SectionFormItem<ClearCutFormInput>[] = [
	{
		name: "hasOtherEcologicalZone",
		label: "Coupe au sein d'autres zone écologiques ?",
		type: "switch",
		renderConditions: []
	},
	{
		name: "otherEcologicalZoneType",
		label: "Type de zonages écologiques",
		type: "textArea",
		renderConditions: ["hasOtherEcologicalZone"]
	},
	{
		name: "hasNearbyEcologicalZone",
		label: "Zonages écologiques à proximité ?",
		type: "switch",
		renderConditions: []
	},
	{
		name: "nearbyEcologicalZoneType",
		label: "Type de zonages écologiques a proximité",
		type: "textArea",
		renderConditions: ["hasNearbyEcologicalZone"]
	},
	{
		name: "protectedSpecies",
		label: "Espèces protégées sur la zone (bibliographie)",
		type: "textArea",
		renderConditions: []
	},
	{
		name: "protectedHabitats",
		label: "Habitat d'espèces protégées sur la zone (bibliographie)",
		type: "textArea",
		renderConditions: []
	},
	{
		name: "hasDdtRequest",
		label:
			"Demande DDT faite sur la réalisation d'une évaluation d'incidence ?",
		type: "switch",
		renderConditions: []
	},
	{
		name: "ddtRequestOwner",
		label: "Par qui ?",
		type: "textArea",
		renderConditions: ["hasDdtRequest"]
	}
]
