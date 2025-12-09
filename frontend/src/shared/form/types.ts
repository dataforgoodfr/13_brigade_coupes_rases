import type {
	ControllerFieldState,
	ControllerRenderProps,
	FieldValues,
	Path,
	UseFormReturn,
	UseFormStateReturn
} from "react-hook-form"

export type FormProps<
	Form extends FieldValues = FieldValues,
	Name extends Path<Form> = Path<Form>
> = {
	form: FormType<Form>
	name: Name
	label?: string
	placeholder?: string
} & FormRenderProps<Form, Name>
export type FormRenderProps<
	Form extends FieldValues = FieldValues,
	Name extends Path<Form> = Path<Form>
> = {
	field: ControllerRenderProps<Form, Name>
	fieldState: ControllerFieldState
	formState: UseFormStateReturn<Form>
}

export type FormType<TFormValues extends FieldValues> =
	UseFormReturn<TFormValues>
