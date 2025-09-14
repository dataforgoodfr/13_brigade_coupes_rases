import type { SectionFormItem } from "@/features/clear-cut/components/form/types";
import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts";
import type { FormType } from "@/shared/form/Form";
import { FormDatePicker } from "@/shared/form/FormDatePicker";
import { FixedField } from "@/shared/form/FormFixedField";
import { FormInput } from "@/shared/form/FormInput";
import { FormS3ImageUpload } from "@/shared/form/FormS3ImageUpload";
import { FormSwitch } from "@/shared/form/FormSwitch";
import { FormTextArea } from "@/shared/form/FormTextArea";
import { FormToggleGroup } from "@/shared/form/FormToggleGroup";

type Props = {
	item: SectionFormItem<ClearCutFormInput>;
	form: FormType<ClearCutFormInput>;
};
const COMMON_PROPS = {
	gap: 1,
	orientation: "vertical",
	align: "start",
} as const;

export function AccordionItem({ item, form }: Props) {
	const render = item.renderConditions.every(
		(value) => !!form.getValues(value),
	);
	const value = item.transformValue
		? item.transformValue({ value: form.getValues(item.name) })
		: form.getValues(item.name)?.toString();
	switch (item.type) {
		case "fixed":
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
		case "inputText":
			return render ? (
				<FormInput
					{...COMMON_PROPS}
					type="text"
					key={item.name}
					form={form}
					name={item.name}
					label={item.label}
				/>
			) : (
				item.fallBack?.(item.name)
			);
		case "inputFile":
			return render ? (
				<FormS3ImageUpload
					{...COMMON_PROPS}
					key={item.name}
					form={form}
					name={item.name}
					label={item.label}
					reportId={form.getValues("report.id")}
				/>
			) : (
				item.fallBack?.(item.name)
			);
		case "datePicker":
			return render ? (
				<FormDatePicker
					{...COMMON_PROPS}
					key={item.name}
					form={form}
					name={item.name}
					label={item.label}
				/>
			) : (
				item.fallBack?.(item.name)
			);
		case "switch":
			return render ? (
				<FormSwitch
					{...COMMON_PROPS}
					key={item.name}
					form={form}
					name={item.name}
					label={item.label}
				/>
			) : (
				item.fallBack?.(item.name)
			);
		case "textArea":
			return render ? (
				<FormTextArea
					{...COMMON_PROPS}
					key={item.name}
					form={form}
					name={item.name}
					label={item.label}
				/>
			) : (
				item.fallBack?.(item.name)
			);
		case "toggleGroup":
			return render ? (
				<FormToggleGroup
					{...COMMON_PROPS}
					key={item.name}
					form={form}
					name={item.name}
					label={item.label}
				/>
			) : (
				item.fallBack?.(item.name)
			);
		case "customized":
			return render
				? item.customizeRender?.(form, item.name)
				: item.fallBack?.(item.name);
		default:
			return undefined;
	}
}
