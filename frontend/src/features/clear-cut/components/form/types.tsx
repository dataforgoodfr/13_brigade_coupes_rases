import type { ClearCutForm } from "@/features/clear-cut/store/clear-cuts";
import type { FormType } from "@/shared/components/form/Form";
import type { JSX } from "react";
import type React from "react";
import type { Path, PathValue } from "react-hook-form";

type BaseFormItem<Form = unknown, Name extends Path<Form> = Path<Form>> = {
	name: Name;
	transformValue?: (props: { value: PathValue<Form, Name> }) =>
		| JSX.Element
		| null
		| undefined;
	label?: string;
	renderConditions: Path<Form>[];
	fallBack?: (key: string | number) => React.ReactNode;
	className?: string;
	customizeRender?: (
		form: FormType<ClearCutForm>,
		key: string | number,
	) => React.ReactNode;
};
export type SwitchItem<
	Form = unknown,
	Name extends Path<Form> = Path<Form>,
> = BaseFormItem<Form, Name> & {
	type: "switch";
};
export type DatePickerItem<
	Form = unknown,
	Name extends Path<Form> = Path<Form>,
> = BaseFormItem<Form, Name> & {
	type: "datePicker";
};
export type TextAreaItem<
	Form = unknown,
	Name extends Path<Form> = Path<Form>,
> = BaseFormItem<Form, Name> & {
	type: "textArea";
};
export type InputTextItem<
	Form = unknown,
	Name extends Path<Form> = Path<Form>,
> = BaseFormItem<Form, Name> & {
	type: "inputText";
};
export type FixedItem<
	Form = unknown,
	Name extends Path<Form> = Path<Form>,
> = BaseFormItem<Form, Name> & {
	type: "fixed";
};

export type InputFileItem<
	Form = unknown,
	Name extends Path<Form> = Path<Form>,
> = BaseFormItem<Form, Name> & {
	type: "inputFile";
};
export type ToggleGroupItem<
	Form = unknown,
	Name extends Path<Form> = Path<Form>,
> = BaseFormItem<Form, Name> & {
	type: "toggleGroup";
};
export type CustomizedItem<
	Form = unknown,
	Name extends Path<Form> = Path<Form>,
> = BaseFormItem<Form, Name> & {
	type: "customized";
};

export type SectionFormItem<
	Form = unknown,
	Name extends Path<Form> = Path<Form>,
> =
	| SwitchItem<Form, Name>
	| DatePickerItem<Form, Name>
	| TextAreaItem<Form, Name>
	| InputTextItem<Form, Name>
	| FixedItem<Form, Name>
	| InputFileItem<Form, Name>
	| ToggleGroupItem<Form, Name>
	| CustomizedItem<Form, Name>;

export type FormItemType = SectionFormItem["type"];

export type SectionForm = {
	name: string;
	className?: string;
};
