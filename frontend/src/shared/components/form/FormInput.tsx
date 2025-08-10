import type { HTMLInputTypeAttribute } from "react";
import type { FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	type FormProps,
} from "./Form";

export function FormInput<T extends FieldValues = FieldValues>({
	control,
	name,
	label,
	type,
	disabled = false,
	...props
}: FormProps<T> & { type: HTMLInputTypeAttribute }) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="flex gap-4 items-center">
					{label && <FormLabel className="font-bold">{label}</FormLabel>}
					<FormControl>
						<Input type={type} disabled={disabled} {...field} {...props} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
