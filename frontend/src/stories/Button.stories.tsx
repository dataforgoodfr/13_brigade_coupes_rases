import {
	Button,
	type ButtonVariantsProps,
} from "@/shared/components/button/Button";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { MailIcon } from "lucide-react";

const meta = {
	title: "Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"destructive",
				"ghost",
				"link",
				"outline",
				"secondary",
			] satisfies ButtonVariantsProps["variant"][],
		},
		size: {
			control: "select",
			options: [
				"default",
				"icon",
				"lg",
				"sm",
			] satisfies ButtonVariantsProps["size"][],
		},
	},
	args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
	args: {
		variant: "default",
		children: "Button",
		size: "default",
	},
};

export const WithIcon: Story = {
	args: {
		variant: "default",
		children: (
			<>
				<MailIcon />
				Button
			</>
		),
		size: "default",
	},
};
