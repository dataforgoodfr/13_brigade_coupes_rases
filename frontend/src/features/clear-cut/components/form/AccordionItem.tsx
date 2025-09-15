import { isUndefined } from "es-toolkit";
import type {
	FormItemType,
	SectionFormItem,
} from "@/features/clear-cut/components/form/types";
import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts";
import { FormField } from "@/shared/form/Form";
import { FormDatePicker } from "@/shared/form/FormDatePicker";
import { FixedField } from "@/shared/form/FormFixedField";
import { FormInput } from "@/shared/form/FormInput";
import { FormS3ImageUpload } from "@/shared/form/FormS3ImageUpload";
import { FormSwitch } from "@/shared/form/FormSwitch";
import { FormTextArea } from "@/shared/form/FormTextArea";
import { FormToggleGroup } from "@/shared/form/FormToggleGroup";
import type { FormType } from "@/shared/form/types";

type Props = {
	item: SectionFormItem<ClearCutFormInput>;
	form: FormType<ClearCutFormInput>;
	original: ClearCutFormInput;
	latest?: ClearCutFormInput;
};
const COMMON_PROPS = {
	gap: 1,
	orientation: "vertical",
	align: "start",
} as const;

function getFormComponent(type: FormItemType) {
	switch (type) {
		case "switch":
			return FormSwitch<ClearCutFormInput>;
		case "datePicker":
			return FormDatePicker<ClearCutFormInput>;
		case "textArea":
			return FormTextArea<ClearCutFormInput>;
		case "inputFile":
			return FormS3ImageUpload<ClearCutFormInput>;
		case "inputText":
			return FormInput<ClearCutFormInput>;
		case "toggleGroup":
			return FormToggleGroup<ClearCutFormInput>;
		default:
			return undefined;
	}
}
export function AccordionItem({ item, form, original, latest }: Props) {
	const render = item.renderConditions.every(
		(value) => !!form.getValues(value),
	);
	const value = item.transformValue
		? item.transformValue({ value: form.getValues(item.name) })
		: form.getValues(item.name)?.toString();
	if (item.type === "fixed") {
		return render ? (
			<FixedField
				key={item.name}
				className={item.className}
				title={item.label}
				value={value}
			/>
		) : (
			item.fallBack?.(item.name)
		);
	}
	if (item.type === "customized") {
		return render
			? item.customizeRender?.(form, item.name)
			: item.fallBack?.(item.name);
	}
	return (
		<FormField<ClearCutFormInput>
			name={item.name}
			render={(rendererProps) => {
				const Component = getFormComponent(item.type);

				if (!isUndefined(Component) && render) {
					return (
						<Component
							{...rendererProps}
							{...COMMON_PROPS}
							{...item}
							originalForm={original}
							latestForm={latest}
							type="text"
							reportId={form.getValues("report.id")}
							field={rendererProps.field}
							form={form}
						/>
					);
				}
				return item.fallBack?.(item.name) ?? <span />;
			}}
		/>
	);
}
