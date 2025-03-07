import { FieldValues } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormProps } from "./Form";
import { Textarea } from "@/components/ui/text-area";

export function FormTextArea<T extends FieldValues = FieldValues>({control, name, label}: FormProps<T>) {
	return(
	<FormField
		control={control}
		name={name}
		render={({ field }) => (
			<FormItem>
				<FormLabel>{label}</FormLabel>
				<FormControl>
					<Textarea {...field}/>
				</FormControl>
				<FormMessage />
			</FormItem>
		)}
	/>);
}