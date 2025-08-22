import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormProvider, useForm } from "react-hook-form";
import {
	FormDatePicker,
	type FormDatePickerProps,
} from "@/shared/components/form/FormDatePicker";

type Props = { date?: string };

const FormDatePickerStory = ({
	date,
	...props
}: Props & Omit<FormDatePickerProps<Props>, "control" | "name">) => {
	const form = useForm({ values: { date } });
	return (
		<FormProvider {...form}>
			<FormDatePicker control={form.control} name="date" {...props} />
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
