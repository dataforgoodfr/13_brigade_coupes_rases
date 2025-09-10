import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
	ToggleGroup,
	ToggleGroupItem,
	type ToggleGroupProps,
} from "@/components/ui/toggle-group";

const meta = {
	title: "Toggle group",
	component: ToggleGroup,
	parameters: {
		layout: "centered",
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "outline"] satisfies ToggleGroupProps["variant"][],
		},
		type: {
			control: "select",
			options: ["multiple", "single"] satisfies ToggleGroupProps["type"][],
		},
	},
	args: { onClick: fn() },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
	args: {
		type: "single",
		variant: "default",
		children: (
			<>
				<ToggleGroupItem value="password">Mot de passe</ToggleGroupItem>
				<ToggleGroupItem value="sso">SSO</ToggleGroupItem>
			</>
		),
	},
};
