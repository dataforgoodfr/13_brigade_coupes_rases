import type { ClearCuttingForm } from "@/features/clear-cutting/store/clear-cuttings";
import type { FormType } from "@/shared/components/form/Form";
import type { Path } from "react-hook-form";

export enum FormItemType {
	Switch = 0,
	DatePicker = 1,
	TextArea = 2,
	InputText = 3,
	Fixed = 4,
	InuptFile = 5,
	ToggleGroup = 6,
	Customized = 7,
}

export type SectionFormItem<T> = {
	name: Path<T>;
	transformValue?: (val: unknown) => string | undefined;
	label?: string;
	type: FormItemType;
	renderConditions: Path<T>[];
	fallBack?: (key: string | number) => React.ReactNode;
	className?: string;
	customizeRender?: (
		form: FormType<ClearCuttingForm>,
		key: string | number,
	) => React.ReactNode;
};

export type SectionForm = {
	name: string;
	className?: string;
};
