import type { FieldValues } from "react-hook-form";
import { Textarea } from "@/components/ui/text-area";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/form/FormFieldLayout";
import { FormField, type FormProps } from "./Form";

export function FormTextArea<Form extends FieldValues = FieldValues>({
	form,
	name,
	placeholder,
	...props
}: FormProps<Form> & FormFieldLayoutProps<Form>) {
	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormFieldLayout {...props} name={name} form={form}>
					<Textarea
						{...field}
						className="mt-2 max-w-[98%] mx-auto"
						placeholder={placeholder}
					/>
				</FormFieldLayout>
			)}
		/>
	);
}
