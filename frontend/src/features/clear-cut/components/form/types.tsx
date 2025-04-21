import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import type { FormType } from "@/shared/components/form/Form";
import type { Path } from "react-hook-form";

type BaseFormItem<Form = unknown> = {
	name: Path<Form>;
	transformValue?: (val: unknown) => string | undefined;
	label?: string;
	renderConditions: Path<Form>[];
	fallBack?: (key: string | number) => React.ReactNode;
	className?: string;
	customizeRender?: (
		form: FormType<ClearCutForm>,
		key: string | number,
	) => React.ReactNode;
};
export type SwitchItem<Form = unknown> = BaseFormItem<Form> & {
	type: "switch";
};
export type DatePickerItem<Form = unknown> = BaseFormItem<Form> & {
	type: "datePicker";
};
export type TextAreaItem<Form = unknown> = BaseFormItem<Form> & {
	type: "textArea";
};
export type InputTextItem<Form = unknown> = BaseFormItem<Form> & {
	type: "inputText";
};
export type FixedItem<Form = unknown> = BaseFormItem<Form> & {
	type: "fixed";
};
export type InputFileItem<Form = unknown> = BaseFormItem<Form> & {
	type: "inputFile";
};
export type ToggleGroupItem<Form = unknown> = BaseFormItem<Form> & {
	type: "toggleGroup";
};
export type CustomizedItem<Form = unknown> = BaseFormItem<Form> & {
	type: "customized";
};

export type SectionFormItem<Form = unknown> =
	| SwitchItem<Form>
	| DatePickerItem<Form>
	| TextAreaItem<Form>
	| InputTextItem<Form>
	| FixedItem<Form>
	| InputFileItem<Form>
	| ToggleGroupItem<Form>
	| CustomizedItem<Form>;

export type FormItemType = SectionFormItem["type"];

export type SectionForm = {
	name: string;
	className?: string;
};
