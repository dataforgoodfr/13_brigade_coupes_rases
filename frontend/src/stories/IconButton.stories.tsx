import type { Meta, StoryObj } from "@storybook/react-vite";
import { MailIcon } from "lucide-react";
import type { ButtonProps } from "@/components/ui/button";
import { IconButton } from "@/shared/components/button/Button";

const meta = {
	title: "IconButton",
	component: IconButton,
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
			] satisfies ButtonProps["variant"][],
		},
		size: {
			control: "select",
			options: ["default", "icon", "lg", "sm"] satisfies ButtonProps["size"][],
		},
	},
	args: {
		variant: "default",
		children: "IconButton",
		size: "default",
		icon: <MailIcon />,
	},
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Start: Story = {
	args: {
		position: "start",
	},
};

export const End: Story = {
	args: {
		position: "end",
	},
};
