import { Button } from "@/components/ui/button";
import {
	type ClearCutForm,
	clearCutFormSchema,
} from "@/features/clear-cutting/store/clear-cuttings";
import { Form } from "@/shared/components/form/Form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Accordion } from "radix-ui";
import { useForm } from "react-hook-form";
import AccordionContent from "./AccordionContent";
import AccordionHeader from "./AccordionHeader";

export default function ClearCuttingFullForm({
	clearCutting: clearCut,
}: { clearCutting: ClearCutForm }) {
	const form = useForm<ClearCutForm>({
		resolver: zodResolver(clearCutFormSchema),
		defaultValues: clearCutFormSchema.parse({
			...clearCut,
			status: clearCut.status,
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
					tags={clearCut.tags}
					status={clearCut.status}
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
