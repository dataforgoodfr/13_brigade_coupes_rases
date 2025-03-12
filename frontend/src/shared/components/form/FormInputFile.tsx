import { Input } from "@/components/ui/input";
import type { FieldValues } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	type FormProps,
} from "./Form";

export function FormInputFile<T extends FieldValues = FieldValues>({
	control,
	name,
	label,
	disabled = false,
	placeholder,
}: FormProps<T>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="flex gap-4 items-center">
					{label && <FormLabel className="font-bold">{label}</FormLabel>}
					<FormControl>
						<Input
							type="file"
							disabled={disabled}
							{...field}
							placeholder={placeholder}
							multiple
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
