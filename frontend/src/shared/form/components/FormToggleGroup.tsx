import type { FieldValues } from "react-hook-form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FormFieldLayout } from "@/shared/form/components/FormFieldLayout";
import type { FormProps } from "../types";

const toggleGroupItemClass =
	"data-[state=on]:bg-(--color-primary) data-[state=on]:text-(--color-primary-foreground)";

export function FormToggleGroup<T extends FieldValues = FieldValues>({
	form,
	name,
	field,
	...props
}: FormProps<T>) {
	return (
		<FormFieldLayout {...props} name={name}>
			<ToggleGroup
				className="shadow-[0px_2px_6px_0px_#00000033] max-w-fit ml-1 my-2"
				type="single"
				disabled={field.disabled}
				value={field.value === null ? "null" : String(field.value)}
				onValueChange={(newValue: string) => {
					const valueMap: Record<string, boolean | null> = {
						true: true,
						false: false,
						null: null,
						"": null,
					};
					field.onChange(valueMap[newValue]);
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
		</FormFieldLayout>
	);
}
