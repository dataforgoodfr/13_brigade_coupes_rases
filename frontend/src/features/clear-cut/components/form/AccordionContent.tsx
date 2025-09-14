import { useEffect, useMemo } from "react";
import { AccordionItem } from "@/features/clear-cut/components/form/AccordionItem";
import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts";
import { useConnectedMe } from "@/features/user/store/me.slice";
import { AccordionFullItem } from "@/shared/components/accordion/FullAccordionItem";
import type { FormType } from "@/shared/components/form/Form";
import { actorsKey, actorsValue } from "./sections/ActorsSection";
import { ecoZoneKey, ecoZoneValue } from "./sections/EcoZoneSection";
import {
	generalInfoKey,
	generalInfoValue,
} from "./sections/GeneralInfoSection";
import { legalKey, legalValue } from "./sections/LegalSection";
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

export default function AccordionContent({
	form,
}: {
	form: FormType<ClearCutFormInput>;
}) {
	const user = useConnectedMe();

	useEffect(() => {
		if (user && user.role === "admin") {
			ccForm.set(legalKey, legalValue);
		} else {
			ccForm.delete(legalKey);
		}
	}, [user]);

	const affectedUser = form.getValues("report.affectedUser");

	const isDisabled = useMemo(() => {
		if (!user) return true;

		if (user.role === "volunteer") {
			return (!affectedUser || affectedUser.login !== user.login) ?? false;
		}

		return false;
	}, [user, affectedUser]);

	return (
		<>
			{[...ccForm].map(([section, sectionContent]) => {
				return (
					<AccordionFullItem
						key={section.name}
						title={section.name}
						{...section}
					>
						{sectionContent.map((item) => (
							<AccordionItem
								form={form}
								item={item}
								isDisabled={isDisabled}
								key={item.name}
							/>
						))}
					</AccordionFullItem>
				);
			})}
		</>
	);
}
