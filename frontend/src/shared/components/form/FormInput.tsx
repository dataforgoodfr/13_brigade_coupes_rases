import type { HTMLInputTypeAttribute } from "react";
import type { FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/components/form/FormFieldLayout";
import { FormField, type FormProps } from "./Form";

export function FormInput<T extends FieldValues = FieldValues>({
	control,
	name,
	type,
	disabled = false,
	...props
}: FormProps<T> & { type: HTMLInputTypeAttribute } & FormFieldLayoutProps) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormFieldLayout {...props}>
					<Input type={type} disabled={disabled} {...field} {...props} />
				</FormFieldLayout>
			)}
		/>
	);
}
