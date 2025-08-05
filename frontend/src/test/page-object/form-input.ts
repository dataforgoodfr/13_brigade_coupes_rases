import { screen } from "@testing-library/react";
import type { UserEvent } from "@vitest/browser/context";
import type { FieldValues } from "react-hook-form";
import { expect } from "vitest";
import type {
	DatePickerItem,
	FixedItem,
	InputFileItem,
	InputTextItem,
	SectionFormItem,
	SwitchItem,
	TextAreaItem,
	ToggleGroupItem,
} from "@/features/clear-cut/components/form/types";
export type TestFormItem<
	Form extends FieldValues,
	Value = unknown,
> = SectionFormItem<Form> & {
	expected: Value;
};
type Options<Form extends FieldValues, Value = unknown> = {
	user: UserEvent;
	item: TestFormItem<Form, Value>;
};

export interface Field<
	Value = unknown,
	Element extends HTMLElement = HTMLElement,
> {
	findValue: () => Promise<Value>;
	findElement: () => Promise<Element>;
}
export interface FieldInput<
	Value = unknown,
	Element extends HTMLElement = HTMLElement,
> extends Field<Value, Element> {
	isDisabled: () => Promise<boolean>;
	expectDisabledState: (state: boolean) => Promise<void>;
}
function findInputByLabel<
	Form extends FieldValues,
	Element extends HTMLElement,
>(item: Exclude<SectionFormItem<Form>, FixedItem<Form>>) {
	return screen.findByLabelText<Element>(item.label ?? item.name);
}
function findElementByLabel<Element extends HTMLElement>(label: string) {
	const findLabel = () => screen.findByText(label);
	return async () => (await findLabel()).nextElementSibling as Element;
}
export function formField<Form extends FieldValues, Value = unknown>({
	item,
}: Options<Form, Value>) {
	switch (item.type) {
		case "fixed":
			return fixedItemField<Form>(item);
		case "datePicker":
		case "textArea":
			return fieldWithTextContentValue<Form>(item);
		case "inputFile":
		case "inputText":
			return fieldWithValue<Form>(item);
		case "switch":
			return switchField<Form>(item);
		case "toggleGroup":
			return toggleGroupField<Form>(item);
		default:
			return;
	}
}

function fixedItemField<Form extends FieldValues>(
	item: FixedItem<Form>,
): Field<string | null, HTMLParagraphElement> {
	const findElement = findElementByLabel<HTMLParagraphElement>(
		`${item.label ?? item.name} :`,
	);
	return {
		findElement,
		findValue: async () => (await findElement()).textContent,
	};
}

function fieldWithTextContentValue<Form extends FieldValues>(
	item: DatePickerItem<Form> | TextAreaItem<Form>,
): FieldInput<string | null, HTMLButtonElement | HTMLTextAreaElement> {
	const field = fieldWithLabel<
		Form,
		string | null,
		HTMLButtonElement | HTMLTextAreaElement
	>(item);
	return {
		...field,
		findValue: async () => {
			const element = await field.findElement();
			return element.textContent;
		},
	};
}
function fieldWithValue<Form extends FieldValues>(
	item: InputTextItem<Form> | InputFileItem<Form>,
): FieldInput<string | null, HTMLInputElement> {
	const field = fieldWithLabel<Form, string | null, HTMLInputElement>(item);
	return {
		...field,
		findValue: async () => {
			const element = await field.findElement();
			return element.getAttribute("value");
		},
	};
}

function switchField<Form extends FieldValues>(
	item: SwitchItem<Form>,
): FieldInput<boolean, HTMLInputElement> {
	const field = fieldWithLabel<Form, boolean, HTMLInputElement>(item);
	return {
		...field,
		findValue: async () => {
			const element = await field.findElement();
			return element.getAttribute("aria-checked") === "true";
		},
	};
}
function toggleGroupField<Form extends FieldValues>(
	item: ToggleGroupItem<Form>,
): FieldInput<boolean | null, HTMLDivElement> {
	const findElement = findElementByLabel<HTMLDivElement>(
		item.label ?? item.name,
	);
	const allDisabled = async () => {
		const buttonsGroup = await findElement();
		return Array.from(buttonsGroup.children).every((button) =>
			button.hasAttribute("disabled"),
		);
	};
	return {
		findElement,
		isDisabled: allDisabled,
		expectDisabledState: async (state) => {
			expect(await allDisabled()).toBe(state);
		},
		findValue: async () => {
			const buttonsGroup = await findElement();
			const checkedButton = Array.from(buttonsGroup.children).find(
				(button) => button.getAttribute("aria-checked") === "on",
			);
			switch (checkedButton?.textContent) {
				case "Oui":
					return true;
				case "Non":
					return false;
				default:
					return null;
			}
		},
	};
}

function fieldWithLabel<
	Form extends FieldValues,
	Value,
	Element extends HTMLElement,
>(
	item:
		| DatePickerItem<Form>
		| TextAreaItem<Form>
		| InputFileItem<Form>
		| InputTextItem<Form>
		| SwitchItem<Form>,
): Omit<FieldInput<Value, Element>, "findValue"> {
	return {
		findElement: () => findInputByLabel<Form, Element>(item),
		isDisabled: async () => {
			return (await findInputByLabel(item)).hasAttribute("disabled");
		},
		expectDisabledState: async (state) => {
			expect(await findInputByLabel(item))[
				state === true ? "to" : "not"
			].toBeDisabled();
		},
	};
}
