import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormProvider, useForm } from "react-hook-form";
import {
	FormDatePicker,
	type FormDatePickerProps,
} from "@/shared/form/FormDatePicker";

type Props = { date?: string };

const FormDatePickerStory = ({
	date,
	...props
}: Props & Omit<FormDatePickerProps<Props>, "form" | "name">) => {
	const form = useForm({ values: { date } });
	return (
		<FormProvider {...form}>
			<FormDatePicker name="date" {...props} form={form} />
		</FormProvider>
	);
};
const meta = {
	title: "FormDatePicker",
	component: FormDatePickerStory,
	parameters: {
		layout: "centered",
	},
	argTypes: { date: { control: "date" } },
	args: {},
} satisfies Meta<typeof FormDatePickerStory>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	args: {},
};
