import type { FieldValues } from "react-hook-form";
import { Textarea } from "@/components/ui/text-area";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	type FormProps,
} from "./Form";

export function FormTextArea<T extends FieldValues = FieldValues>({
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
				<FormItem>
					{label && <FormLabel className="font-bold">{label}</FormLabel>}
					<FormControl>
						<Textarea
							{...field}
							disabled={disabled}
							className="mt-2 max-w-[98%] mx-auto"
							placeholder={placeholder}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
