import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { FieldValues } from "react-hook-form"
import { FormattedDate } from "react-intl"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
	FormFieldLayout,
	type FormFieldLayoutProps
} from "@/shared/form/components/FormFieldLayout"

import { FormControl } from "./Form"
import type { FormProps } from "../types"

export type FormDatePickerProps<Form extends FieldValues> = FormProps<Form> &
	FormFieldLayoutProps<Form>
export function FormDatePicker<Form extends FieldValues = FieldValues>({
	form,
	name,
	field,
	...props
}: FormDatePickerProps<Form>) {
	return (
		<FormFieldLayout {...props} name={name} withControl={false}>
			<Popover>
				<PopoverTrigger asChild disabled={field.disabled}>
					<FormControl>
						<Button
							disabled={field.disabled}
							type="button"
							variant="outline"
							className={cn(
								"w-[240px] pl-3 text-left font-normal",
								!field.value && "text-muted-foreground"
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
						onSelect={(v) => field.onChange(v?.toISOString())}
						captionLayout="dropdown"
					/>
				</PopoverContent>
			</Popover>
		</FormFieldLayout>
	)
}
