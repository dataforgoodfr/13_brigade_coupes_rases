import { MultiSelectComboboxFilter } from "@/shared/components/select/MultiSelectComboboxFilter";

import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "Multi select combobox filter",
	component: MultiSelectComboboxFilter<string>,
	parameters: {
		layout: "centered",
	},
	argTypes: {
		items: { control: { type: "object" } },
	},
	args: {
		items: [
			{ isSelected: true, item: "rouge" },
			{ isSelected: false, item: "bleu" },
		],
		onItemToggled(item) {
			action("onItemToggled")(item);
		},
		onItemsUnselected(items) {
			action("onItemsUnselected")(items);
		},
		label: "Couleur",
		getItemLabel: (item) => item.item,
		getItemValue: (item) => item.item,
	},
} satisfies Meta<typeof MultiSelectComboboxFilter<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
	args: {},
};
