import { Button } from "@/components/ui/button";
import {
	type ClearCutForm,
	clearCutFormSchema,
} from "@/features/clear-cut/store/clear-cuts";
import { Form } from "@/shared/components/form/Form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Accordion } from "radix-ui";
import { useForm } from "react-hook-form";
import AccordionContent from "./AccordionContent";
import AccordionHeader from "./AccordionHeader";

export function ClearCutFullForm({ clearCut }: { clearCut: ClearCutForm }) {
	const form = useForm<ClearCutForm>({
		resolver: zodResolver(clearCutFormSchema),
		defaultValues: clearCutFormSchema.parse({
			...clearCut,
			status: clearCut.status,
		}),
	});

	return (
		<>
			<AccordionHeader
				form={form}
				tags={clearCut.rules}
				status={clearCut.status}
			/>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit((form) => console.log(form))}
					className="p-1 flex flex-col grow px-4 h-0"
				>
					<Accordion.Root type="multiple" className="grow overflow-auto">
						<AccordionContent form={form} />
					</Accordion.Root>
				</form>
				<Button
					type="submit"
					className="mx-auto my-1 text-xl font-bold  cursor-pointer"
					size="lg"
				>
					Valider
				</Button>
			</Form>
		</>
	);
}
