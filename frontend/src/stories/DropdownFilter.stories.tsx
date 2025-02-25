import { DropdownFilter } from "@/shared/components/dropdown/DropdownFilter";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "Dropdown filter",
	component: DropdownFilter,
	parameters: {
		layout: "centered",
	},
	argTypes: {
		filter: { control: { type: "text" } },
	},
	args: { filter: "Superficie" },
} satisfies Meta<typeof DropdownFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
	args: {},
};
