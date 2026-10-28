import { useLayoutEffect, useRef } from "react"
import type { FieldValues } from "react-hook-form"

import { Textarea } from "@/components/ui/text-area"
import {
	FormFieldLayout,
	type FormFieldLayoutProps
} from "@/shared/form/components/FormFieldLayout"

import type { FormProps } from "../types"

// Grows the field with its text (up to its max height), and keeps it in view
// while typing so that the line being written is never hidden.
function fitToContent(textArea: HTMLTextAreaElement | null) {
	if (!textArea) return
	textArea.style.height = "auto"
	const borders = textArea.offsetHeight - textArea.clientHeight
	textArea.style.height = `${textArea.scrollHeight + borders}px`
	if (document.activeElement === textArea) {
		textArea.scrollIntoView({ block: "nearest" })
	}
}

export function FormTextArea<Form extends FieldValues = FieldValues>({
	form,
	name,
	placeholder,
	field,
	...props
}: FormProps<Form> & FormFieldLayoutProps<Form>) {
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
	// biome-ignore lint/correctness/useExhaustiveDependencies: refit on each new value
	useLayoutEffect(() => {
		fitToContent(textAreaRef.current)
	}, [field.value])

	return (
		<FormFieldLayout {...props} name={name}>
			<Textarea
				{...field}
				ref={(textArea) => {
					textAreaRef.current = textArea
					field.ref(textArea)
				}}
				rows={4}
				className="mt-2 max-w-[98%] mx-auto max-h-[40dvh]"
				placeholder={placeholder}
			/>
		</FormFieldLayout>
	)
}
