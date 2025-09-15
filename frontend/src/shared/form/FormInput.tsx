import type { HTMLInputTypeAttribute } from "react";
import type { FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/form/FormFieldLayout";
import { FormField } from "./Form";
import type { FormProps } from "./types";

export function FormInput<Form extends FieldValues = FieldValues>({
	form,
	name,
	type,
	...props
}: FormProps<Form> & {
	type: HTMLInputTypeAttribute;
} & FormFieldLayoutProps<Form>) {
	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormFieldLayout {...props} name={name} form={form}>
					<Input type={type} {...field} {...props} />
				</FormFieldLayout>
			)}
		/>
	);
}
