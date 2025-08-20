import type { FieldValues } from "react-hook-form";
import { Textarea } from "@/components/ui/text-area";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/components/form/FormFieldLayout";
import { FormField, type FormProps } from "./Form";

export function FormTextArea<T extends FieldValues = FieldValues>({
	control,
	name,
	disabled = false,
	placeholder,
	...props
}: FormProps<T> & FormFieldLayoutProps) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormFieldLayout {...props}>
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
