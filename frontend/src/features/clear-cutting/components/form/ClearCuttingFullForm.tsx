import { Button } from "@/components/ui/button";
import {
	type ClearCutting,
	type ClearCuttingForm,
	clearCuttingFormSchema,
} from "@/features/clear-cutting/store/clear-cuttings";
import { Form } from "@/shared/components/form/Form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Accordion } from "radix-ui";
import { useForm } from "react-hook-form";
import AccordionContent from "./AccordionContent";
import AccordionHeader from "./AccordionHeader";

export default function ClearCuttingFullForm({
	clearCutting,
}: { clearCutting: ClearCutting }) {
	const form = useForm<ClearCuttingForm>({
		resolver: zodResolver(clearCuttingFormSchema),
		defaultValues: clearCuttingFormSchema.parse({
			...clearCutting,
			status: clearCutting.status.name,
		}),
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((form) => console.log(form))}
				className="p-1 flex flex-col flex-grow overflow-scroll px-4"
			>
				<AccordionHeader
					form={form}
					abusiveTags={clearCutting.abusiveTags}
					status={clearCutting.status}
				/>
				<Accordion.Root type="multiple" className="grow">
					<AccordionContent form={form} />
				</Accordion.Root>
				<Button
					type="submit"
					className="mx-auto text-xl font-bold mt-12 cursor-pointer"
					size="lg"
				>
					Valider
				</Button>
			</form>
		</Form>
	);
}
