import type { FieldValues } from "react-hook-form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/Select";
import { FormFieldLayout } from "@/shared/form/FormFieldLayout";
import type { LabelledValue } from "@/shared/items";
import { FormField, type FormProps } from "./Form";

export function FormSelect<T extends FieldValues = FieldValues>({
	form,
	name,
	placeholder,
	availableValues,
	...props
}: FormProps<T> & {
	availableValues: LabelledValue[];
}) {
	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => {
				return (
					<FormFieldLayout {...props} name={name} form={form}>
						<Select value={field.value} onValueChange={field.onChange}>
							<SelectTrigger>
								<SelectValue placeholder={placeholder} />
							</SelectTrigger>
							<SelectContent>
								{availableValues.map(({ label, value }) => (
									<SelectItem value={value} key={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormFieldLayout>
				);
			}}
		/>
	);
}
