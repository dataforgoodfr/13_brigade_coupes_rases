import type { ClearCutForm } from "@/features/clear-cutting/store/clear-cuttings";
import { selectLoggedUser } from "@/features/user/store/user.slice";
import { AccordionFullItem } from "@/shared/components/accordion/FullAccordionItem";
import type { FormType } from "@/shared/components/form/Form";
import { FormDatePicker } from "@/shared/components/form/FormDatePicker";
import { FixedField } from "@/shared/components/form/FormFixedField";
import { FormInputFile } from "@/shared/components/form/FormInputFile";
import { FormInputText } from "@/shared/components/form/FormInputText";
import { FormSwitch } from "@/shared/components/form/FormSwitch";
import { FormTextArea } from "@/shared/components/form/FormTextArea";
import { FormToggleGroup } from "@/shared/components/form/FormToggleGroup";
import { useAppSelector } from "@/shared/hooks/store";
import { useEffect } from "react";
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
import { FormItemType, type SectionForm, type SectionFormItem } from "./types";

const ccForm: Map<SectionForm, SectionFormItem<ClearCutForm>[]> = new Map();
ccForm.set(generalInfoKey, generalInfoValue);
ccForm.set(onSiteKey, onSiteValue);
ccForm.set(ecoZoneKey, ecoZoneValue);
ccForm.set(actorsKey, actorsValue);
ccForm.set(regulationsKey, regulationsValue);
ccForm.set(otherInfoKey, otherInfoValue);

export default function AccordionContent({
	form,
}: { form: FormType<ClearCutForm> }) {
	const user = useAppSelector(selectLoggedUser);

	useEffect(() => {
		if (user && user.role === "admin") {
			ccForm.set(legalKey, legalValue);
		} else {
			ccForm.delete(legalKey);
		}
	}, [user]);

	const assignedUser = form.getValues("assignedUser");

	const isDisabled = () => {
		if (!user) return true;

		if (user.role === "volunteer") {
			if (!assignedUser) return true;
			if (assignedUser.login !== user.login) return true;
		}

		return false;
	};

	return (
		<>
			{[...ccForm].map(([section, sectionContent]) => {
				return (
					<AccordionFullItem
						key={section.name}
						title={section.name}
						{...section}
					>
						{sectionContent.map((item) => {
							let render = true;
							render = item.renderConditions.every(
								(value) => !!form.getValues(value),
							);
							const value = item.transformValue
								? item.transformValue(form.getValues(item.name))
								: form.getValues(item.name)?.toString();

							switch (item.type) {
								case FormItemType.Fixed:
									return render ? (
										<FixedField
											key={item.name}
											className={item.className}
											title={item.label}
											value={value}
										/>
									) : item.fallBack ? (
										item.fallBack(item.name)
									) : null;
								case FormItemType.InputText:
									return render ? (
										<FormInputText
											key={item.name}
											control={form.control}
											name={item.name}
											label={item.label}
											disabled={isDisabled()}
										/>
									) : item.fallBack ? (
										item.fallBack(item.name)
									) : null;
								case FormItemType.InuptFile:
									return render ? (
										<FormInputFile
											key={item.name}
											control={form.control}
											name={item.name}
											label={item.label}
											disabled={isDisabled()}
										/>
									) : item.fallBack ? (
										item.fallBack(item.name)
									) : null;
								case FormItemType.DatePicker:
									return render ? (
										<FormDatePicker
											key={item.name}
											control={form.control}
											name={item.name}
											label={item.label}
											disabled={isDisabled()}
										/>
									) : item.fallBack ? (
										item.fallBack(item.name)
									) : null;
								case FormItemType.Switch:
									return render ? (
										<FormSwitch
											key={item.name}
											control={form.control}
											name={item.name}
											label={item.label}
											disabled={isDisabled()}
										/>
									) : item.fallBack ? (
										item.fallBack(item.name)
									) : null;
								case FormItemType.TextArea:
									return render ? (
										<FormTextArea
											key={item.name}
											control={form.control}
											name={item.name}
											label={item.label}
											disabled={isDisabled()}
										/>
									) : item.fallBack ? (
										item.fallBack(item.name)
									) : null;
								case FormItemType.ToggleGroup:
									return render ? (
										<FormToggleGroup
											key={item.name}
											control={form.control}
											name={item.name}
											label={item.label}
											disabled={isDisabled()}
										/>
									) : item.fallBack ? (
										item.fallBack(item.name)
									) : null;
								case FormItemType.Customized:
									if (item.customizeRender)
										return render
											? item.customizeRender(form, item.name)
											: item.fallBack
												? item.fallBack(item.name)
												: null;
									return null;
								default:
									return null;
							}
						})}
					</AccordionFullItem>
				);
			})}
		</>
	);
}
