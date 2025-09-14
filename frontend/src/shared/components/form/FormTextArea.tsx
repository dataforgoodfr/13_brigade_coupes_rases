import type { FieldValues } from "react-hook-form";
import { Textarea } from "@/components/ui/text-area";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/components/form/FormFieldLayout";
import { FormField, type FormProps } from "./Form";

export function FormTextArea<Form extends FieldValues = FieldValues>({
	control,
	name,
	disabled = false,
	placeholder,
	...props
}: FormProps<Form> & FormFieldLayoutProps<Form>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormFieldLayout {...props} name={name} control={control}>
					<Textarea
						{...field}
						disabled={disabled}
						className="mt-2 max-w-[98%] mx-auto"
						placeholder={placeholder}
					/>
				</FormFieldLayout>
			)}
		/>
	);
}
