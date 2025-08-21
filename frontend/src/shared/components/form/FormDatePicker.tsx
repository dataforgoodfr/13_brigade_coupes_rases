import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { FormattedDate } from "react-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
	FormFieldLayout,
	type FormFieldLayoutProps,
} from "@/shared/components/form/FormFieldLayout";
import { FormField, type FormProps, useFormField } from "./Form";

type PickerButtonProps<T extends FieldValues> = {
	field: ControllerRenderProps<T>;
	disabled: boolean;
};
const PickerButton = <T extends FieldValues>({
	field,
	disabled,
}: PickerButtonProps<T>) => {
	const { formItemId } = useFormField();
	return (
		<Button
			id={formItemId}
			disabled={disabled}
			variant={"outline"}
			className={cn(
				"w-[240px] pl-3 text-left font-normal",
				!field.value && "text-muted-foreground",
			)}
		>
			{field.value ? (
				<FormattedDate value={field.value} />
			) : (
				<span>Sélectionner une date</span>
			)}
			<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
		</Button>
	);
};
export function FormDatePicker<T extends FieldValues = FieldValues>({
	control,
	name,
	disabled = false,
	...props
}: FormProps<T> & FormFieldLayoutProps) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormFieldLayout {...props}>
					<Popover>
						<PopoverTrigger asChild disabled={disabled}>
							<PickerButton field={field} disabled={disabled} />
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								locale={fr}
								selected={field.value}
								onSelect={field.onChange}
								disabled={(date) =>
									date > new Date() || date < new Date("1900-01-01")
								}
								initialFocus
							/>
						</PopoverContent>
					</Popover>
				</FormFieldLayout>
			)}
		/>
	);
}
