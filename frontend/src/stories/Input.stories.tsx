import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "@/shared/components/input/Input"

const meta = {
	title: "Input",
	component: Input,
	parameters: {
		layout: "centered"
	},
	argTypes: {
		prefix: { control: { type: "text" } },
		suffix: { control: { type: "text" } }
	},
	args: { suffix: "Hectare" }
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
	args: {}
}
