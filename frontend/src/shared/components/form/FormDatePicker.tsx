import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { FieldValues } from "react-hook-form";
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
import { FormField, type FormProps } from "./Form";

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
							<Button
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
