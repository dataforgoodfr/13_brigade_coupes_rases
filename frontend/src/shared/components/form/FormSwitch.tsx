import { FieldValues } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormProps } from "./Form";
import { Switch } from "@/components/ui/switch";

export function FormSwitch<T extends FieldValues = FieldValues>({control, name, label}: FormProps<T>) {
	return (
	<FormField
		control={control}
		name={name}
		render={({ field }) => (
			<FormItem>
				<FormLabel>{label}</FormLabel>
				<FormControl>
					<Switch
					checked={field.value}
					onCheckedChange={field.onChange} />
				</FormControl>
				<FormMessage />
			</FormItem>	
		)}/>);
}