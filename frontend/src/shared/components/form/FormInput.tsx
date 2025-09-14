import type { HTMLInputTypeAttribute } from "react";
import { type FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/components/form/FormFieldLayout";
import { FormField, type FormProps } from "./Form";

export function FormInput<Form extends FieldValues = FieldValues>({
	control,
	name,
	type,
	disabled = false,
	...props
}: FormProps<Form> & {
	type: HTMLInputTypeAttribute;
} & FormFieldLayoutProps<Form>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormFieldLayout {...props} name={name} control={control}>
					<Input type={type} disabled={disabled} {...field} {...props} />
				</FormFieldLayout>
			)}
		/>
	);
}
