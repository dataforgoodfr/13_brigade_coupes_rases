import type { Meta, StoryObj } from "@storybook/react-vite"
import { action } from "storybook/actions"

import {
	ComboboxFilter,
	type ComboboxFilterProps
} from "@/shared/components/select/ComboboxFilter"

const meta = {
	title: "Combobox filter",
	component: ComboboxFilter<string>,
	parameters: {
		layout: "centered"
	},
	argTypes: {
		items: { control: { type: "object" } },
		hasReset: { options: [true, false], control: { type: "radio" } },
		hasInput: { options: [true, false], control: { type: "radio" } },
		countPreview: { options: [true, false], control: { type: "radio" } },
		label: { control: { type: "text" } },
		type: {
			options: [
				"multiple",
				"single"
			] satisfies ComboboxFilterProps<string>["type"][],
			control: { type: "select" }
		}
	},
	args: {
		hasInput: true,
		type: "multiple",
		items: [
			{ isSelected: true, item: "rouge", label: "Rouge", value: "rouge" },
			{ isSelected: false, item: "bleu", label: "Bleu", value: "bleu" }
		],
		onChanged(item) {
			action("onChanged")(item)
		},
		changeOnClose: (items) => {
			action("changeOnClose")(items)
		},
		label: "Couleur"
	}
} satisfies Meta<typeof ComboboxFilter<string>>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
	args: {
		hasReset: true
	}
}
