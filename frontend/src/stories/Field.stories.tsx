import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/components/form/Form";
import { Input } from "@/shared/components/input/Input";
import { PasswordInput } from "@/shared/components/input/PasswordInput";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import type { HTMLInputTypeAttribute } from "react";
import {
	type ControllerProps,
	type FieldPath,
	type FieldValues,
	useForm,
} from "react-hook-form";
import { z } from "zod";
type FormFieldInForm<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ControllerProps<TFieldValues, TName> & {
	label?: string;
	description?: string;
	placeholder?: string;
	valueSchema: z.ZodTypeAny;
	inputType: HTMLInputTypeAttribute;
};
const meta: Meta<FormFieldInForm> = {
	title: "Form field",
	component: FormField,
	parameters: {
		layout: "centered",
	},
	render: ({
		label,
		description,
		placeholder,
		defaultValue,
		valueSchema,
		inputType,
		...props
	}) => {
		const form = useForm({
			resolver: zodResolver(z.object({ field: valueSchema })),
			defaultValues: { field: defaultValue },
			mode: "onChange",
		});

		return (
			<Form {...form}>
				<FormField
					{...props}
					name="field"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>{label}</FormLabel>
								<FormControl>
									{inputType !== "password" ? (
										<Input
											type={inputType}
											placeholder={placeholder}
											{...field}
										/>
									) : (
										<PasswordInput placeholder={placeholder} {...field} />
									)}
								</FormControl>
								<FormDescription>{description}</FormDescription>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
			</Form>
		);
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Email: Story = {
	args: {
		label: "Email",
		defaultValue: "email@email.com",
		valueSchema: z.string().email(),
	},
};

export const Password: Story = {
	args: {
		label: "Password",
		defaultValue: "password",
		inputType: "password",
		valueSchema: z.string(),
	},
};
