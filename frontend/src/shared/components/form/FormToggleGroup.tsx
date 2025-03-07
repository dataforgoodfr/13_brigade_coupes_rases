import { FieldValues } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormProps } from "./Form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function FormToggleGroup<T extends FieldValues = FieldValues>({control, name, label}: FormProps<T>) {
	
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) =>{ console.log(field);
				return(

				<FormItem>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<ToggleGroup type="single" defaultValue={field.value + ""} onValueChange={(newValue) => {
								if (newValue) 
									return field.onChange(newValue)
							}}>
							<ToggleGroupItem value="true">Oui</ToggleGroupItem>
							<ToggleGroupItem value="false">Non</ToggleGroupItem>
							<ToggleGroupItem value="null">Pas d'informations</ToggleGroupItem>
						</ToggleGroup>
					</FormControl>
					<FormMessage />
				</FormItem>	
			)}}
		/>);
}