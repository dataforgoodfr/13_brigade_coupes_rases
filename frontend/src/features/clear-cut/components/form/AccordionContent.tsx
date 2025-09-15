import { AccordionItem } from "@/features/clear-cut/components/form/AccordionItem";
import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts";
import { useConnectedMe } from "@/features/user/store/me.slice";
import { AccordionFullItem } from "@/shared/components/accordion/FullAccordionItem";
import type { FormType } from "@/shared/form/types";
import { actorsKey, actorsValue } from "./sections/ActorsSection";
import { ecoZoneKey, ecoZoneValue } from "./sections/EcoZoneSection";
import {
	generalInfoKey,
	generalInfoValue,
} from "./sections/GeneralInfoSection";
import { legalKey } from "./sections/LegalSection";
import { onSiteKey, onSiteValue } from "./sections/OnSiteSection";
import { otherInfoKey, otherInfoValue } from "./sections/OtherInfoSection";
import {
	regulationsKey,
	regulationsValue,
} from "./sections/RegulationsSection";
import type { SectionForm, SectionFormItem } from "./types";

const ccForm: Map<SectionForm, SectionFormItem<ClearCutFormInput>[]> =
	new Map();
ccForm.set(generalInfoKey, generalInfoValue);
ccForm.set(onSiteKey, onSiteValue);
ccForm.set(ecoZoneKey, ecoZoneValue);
ccForm.set(actorsKey, actorsValue);
ccForm.set(regulationsKey, regulationsValue);
ccForm.set(otherInfoKey, otherInfoValue);

type Props = {
	form: FormType<ClearCutFormInput>;
	original: ClearCutFormInput;
	latest?: ClearCutFormInput;
};
export default function AccordionContent({ form, original, latest }: Props) {
	const user = useConnectedMe();

	return (
		<>
			{[...ccForm].map(([section, sectionContent]) => {
				if (user?.role === "admin" && section === legalKey) {
					return undefined;
				}
				return (
					<AccordionFullItem
						key={section.name}
						title={section.name}
						{...section}
					>
						{sectionContent.map((item) => (
							<AccordionItem
								latest={latest}
								form={form}
								item={item}
								key={item.name}
								original={original}
							/>
						))}
					</AccordionFullItem>
				);
			})}
		</>
	);
}
