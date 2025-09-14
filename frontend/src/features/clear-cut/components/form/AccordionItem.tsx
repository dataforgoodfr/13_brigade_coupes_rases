import type { SectionFormItem } from "@/features/clear-cut/components/form/types";
import type { ClearCutFormInput } from "@/features/clear-cut/store/clear-cuts";
import type { FormType } from "@/shared/components/form/Form";
import { FormDatePicker } from "@/shared/components/form/FormDatePicker";
import { FixedField } from "@/shared/components/form/FormFixedField";
import { FormInput } from "@/shared/components/form/FormInput";
import { FormS3ImageUpload } from "@/shared/components/form/FormS3ImageUpload";
import { FormSwitch } from "@/shared/components/form/FormSwitch";
import { FormTextArea } from "@/shared/components/form/FormTextArea";
import { FormToggleGroup } from "@/shared/components/form/FormToggleGroup";

type Props = {
	item: SectionFormItem<ClearCutFormInput>;
	form: FormType<ClearCutFormInput>;
	isDisabled: boolean;
};
const COMMON_PROPS = {
	gap: 1,
	orientation: "vertical",
	align: "start",
} as const;

export function AccordionItem({ item, form, isDisabled }: Props) {
	let render = true;
	render = item.renderConditions.every((value) => !!form.getValues(value));
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
			) : item.fallBack ? (
				item.fallBack(item.name)
			) : null;
		case "inputText":
			return render ? (
				<FormInput
					{...COMMON_PROPS}
					type="text"
					key={item.name}
					control={form.control}
					name={item.name}
					label={item.label}
					disabled={isDisabled}
				/>
			) : item.fallBack ? (
				item.fallBack(item.name)
			) : null;
		case "inputFile":
			return render ? (
				<FormS3ImageUpload
					{...COMMON_PROPS}
					key={item.name}
					control={form.control}
					name={item.name}
					label={item.label}
					disabled={isDisabled}
					reportId={form.getValues("report.id")}
				/>
			) : item.fallBack ? (
				item.fallBack(item.name)
			) : null;
		case "datePicker":
			return render ? (
				<FormDatePicker
					{...COMMON_PROPS}
					key={item.name}
					control={form.control}
					name={item.name}
					label={item.label}
					disabled={isDisabled}
				/>
			) : item.fallBack ? (
				item.fallBack(item.name)
			) : null;
		case "switch":
			return render ? (
				<FormSwitch
					{...COMMON_PROPS}
					key={item.name}
					control={form.control}
					name={item.name}
					label={item.label}
					disabled={isDisabled}
				/>
			) : item.fallBack ? (
				item.fallBack(item.name)
			) : null;
		case "textArea":
			return render ? (
				<FormTextArea
					{...COMMON_PROPS}
					key={item.name}
					control={form.control}
					name={item.name}
					label={item.label}
					disabled={isDisabled}
				/>
			) : item.fallBack ? (
				item.fallBack(item.name)
			) : null;
		case "toggleGroup":
			return render ? (
				<FormToggleGroup
					{...COMMON_PROPS}
					key={item.name}
					control={form.control}
					name={item.name}
					label={item.label}
					disabled={isDisabled}
				/>
			) : item.fallBack ? (
				item.fallBack(item.name)
			) : null;
		case "customized":
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
}
