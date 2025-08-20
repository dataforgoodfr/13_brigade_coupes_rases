import type { FieldValues } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/components/form/FormFieldLayout";
import { FormField, type FormProps } from "./Form";

export function FormSwitch<T extends FieldValues = FieldValues>({
	control,
	name,
	disabled = false,
	...props
}: FormProps<T> & FormFieldLayoutProps) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormFieldLayout {...props}>
					<Switch
						disabled={disabled}
						checked={field.value}
						onCheckedChange={field.onChange}
					/>
				</FormFieldLayout>
			)}
		/>
	);
}
