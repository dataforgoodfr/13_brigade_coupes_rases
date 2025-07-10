import { Button } from "@/components/ui/button";
import {
	type ClearCutForm,
	clearCutFormSchema,
} from "@/features/clear-cut/store/clear-cuts";
import {
	selectSubmission,
	submitClearCutFormThunk,
} from "@/features/clear-cut/store/clear-cuts-slice";
import { Form } from "@/shared/components/form/Form";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Accordion } from "radix-ui";
import React from "react";
import { useForm } from "react-hook-form";
import AccordionContent from "./AccordionContent";
import AccordionHeader from "./AccordionHeader";

export function ClearCutFullForm({ clearCut }: { clearCut: ClearCutForm }) {
	const dispatch = useAppDispatch();
	const submission = useAppSelector(selectSubmission);

	const form = useForm<ClearCutForm>({
		resolver: zodResolver(clearCutFormSchema),
		defaultValues: clearCutFormSchema.parse({
			...clearCut,
			status: clearCut.status,
		}),
	});

	// Update form values when clearCut prop changes (e.g., after data reload)
	const resetForm = React.useCallback(
		(data: ClearCutForm) => {
			const parsedData = clearCutFormSchema.parse({
				...data,
				status: data.status,
			});
			form.reset(parsedData);
		},
		[form],
	);

	React.useEffect(() => {
		if (clearCut) {
			resetForm(clearCut);
		}
	}, [clearCut, resetForm]);

	const handleSubmit = (formData: ClearCutForm) => {
		dispatch(
			submitClearCutFormThunk({
				reportId: clearCut.id,
				formData,
			}),
		);
	};

	return (
		<>
			<AccordionHeader
				form={form}
				tags={clearCut.rules}
				status={clearCut.status}
			/>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="p-1 flex flex-col grow px-4 h-0"
				>
					<Accordion.Root type="multiple" className="grow overflow-auto">
						<AccordionContent form={form} />
					</Accordion.Root>
					<Button
						type="submit"
						className="mx-auto my-1 text-xl font-bold cursor-pointer"
						size="lg"
						disabled={submission.status === "loading"}
					>
						{submission.status === "loading" ? "Envoi en cours..." : "Valider"}
					</Button>
				</form>
			</Form>
		</>
	);
}
