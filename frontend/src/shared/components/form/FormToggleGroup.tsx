import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FieldValues } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	type FormProps,
} from "./Form";

export function FormToggleGroup<T extends FieldValues = FieldValues>({
	control,
	name,
	label,
	disabled = false,
}: FormProps<T>) {
	const toggleGroupItemClass =
		"data-[state=on]:bg-(--color-primary) data-[state=on]:text-(--color-primary-foreground)";

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				return (
					<FormItem>
						{label && (
							<FormLabel className="font-bold block">{label}</FormLabel>
						)}
						<FormControl>
							<ToggleGroup
								className="shadow-[0px_2px_6px_0px_#00000033] max-w-fit ml-1 my-2"
								type="single"
								disabled={disabled}
								value={`${field.value}`}
								onValueChange={(newValue) => {
									if (newValue) {
										return field.onChange(newValue);
									}
									return;
								}}
							>
								<ToggleGroupItem className={toggleGroupItemClass} value="true">
									Oui
								</ToggleGroupItem>
								<ToggleGroupItem className={toggleGroupItemClass} value="false">
									Non
								</ToggleGroupItem>
								<ToggleGroupItem className={toggleGroupItemClass} value="null">
									Pas d'informations
								</ToggleGroupItem>
							</ToggleGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
}