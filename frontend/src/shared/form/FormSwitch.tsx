import type { FieldValues } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/form/FormFieldLayout";
import { FormField, type FormProps } from "./Form";

export function FormSwitch<T extends FieldValues = FieldValues>({
	form,
	name,
	...props
}: FormProps<T> & FormFieldLayoutProps<T>) {
	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormFieldLayout {...props} name={name} form={form}>
					<Switch
						disabled={field.disabled}
						checked={field.value}
						onCheckedChange={field.onChange}
					/>
				</FormFieldLayout>
			)}
		/>
	);
}
