import type { FieldValues } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	type FormProps,
} from "./Form";

export function FormSwitch<T extends FieldValues = FieldValues>({
	control,
	name,
	label,
	disabled = false,
}: FormProps<T>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="flex gap-4 items-center">
					{label && <FormLabel className="font-bold">{label}</FormLabel>}
					<FormControl>
						<Switch
							disabled={disabled}
							checked={field.value}
							onCheckedChange={field.onChange}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
