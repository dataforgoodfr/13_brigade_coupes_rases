import type { Meta, StoryObj } from "@storybook/react-vite"
import { FormProvider, useForm } from "react-hook-form"

import { FormField } from "@/shared/form/components/Form"
import {
	FormDatePicker,
	type FormDatePickerProps
} from "@/shared/form/components/FormDatePicker"
import { ChangeTrackingProvider } from "@/shared/form/context/ChangeTrackingForm"
import type { FormRenderProps } from "@/shared/form/types"

type Props = { date?: string }

const FormDatePickerStory = ({
	date,
	...props
}: Props &
	Omit<
		FormDatePickerProps<Props>,
		"form" | "name" | keyof FormRenderProps
	>) => {
	const form = useForm<Props>({ values: { date } })
	// Le suivi des modifications de FormFieldLayout lit ce contexte, comme dans
	// le formulaire de l'application (AccordionContent).
	return (
		<FormProvider {...form}>
			<ChangeTrackingProvider
				form={form}
				others={{ original: { date }, latest: { date } }}
				trackedFields={["date"]}
			>
				<FormField<Props, "date">
					name="date"
					form={form}
					render={(renderProps) => (
						<FormDatePicker<Props>
							label="Date"
							{...renderProps}
							{...props}
							form={form}
						/>
					)}
				/>
			</ChangeTrackingProvider>
		</FormProvider>
	)
}
const meta = {
	title: "FormDatePicker",
	component: FormDatePickerStory,
	parameters: {
		layout: "centered"
	},
	argTypes: { date: { control: "date" } },
	args: {}
} satisfies Meta<typeof FormDatePickerStory>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
	args: {}
}
