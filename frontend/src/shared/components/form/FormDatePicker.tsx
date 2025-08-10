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
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	type FormProps,
} from "./Form";

export function FormDatePicker<T extends FieldValues = FieldValues>({
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
				<FormItem className="flex flex-col">
					{label && <FormLabel className="font-bold">{label}</FormLabel>}
					<Popover>
						<PopoverTrigger asChild disabled={disabled}>
							<FormControl>
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
							</FormControl>
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
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
