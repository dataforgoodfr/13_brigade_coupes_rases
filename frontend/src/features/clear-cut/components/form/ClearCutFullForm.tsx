import { zodResolver } from "@hookform/resolvers/zod";
import { Accordion } from "radix-ui";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	type ClearCutForm,
	clearCutFormSchema,
} from "@/features/clear-cut/store/clear-cuts";
import {
	selectSubmission,
	submitClearCutFormThunk,
} from "@/features/clear-cut/store/clear-cuts-slice";
import { useLoggedUser } from "@/features/user/store/user.slice";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import AccordionContent from "./AccordionContent";
import AccordionHeader from "./AccordionHeader";

export function ClearCutFullForm({ clearCut }: { clearCut: ClearCutForm }) {
	const dispatch = useAppDispatch();
	const submission = useAppSelector(selectSubmission);
	const loggedUser = useLoggedUser();
	const form = useForm({
		resolver: zodResolver(clearCutFormSchema),
		values: clearCut,
	});
	const { toast } = useToast();

	const handleSubmit = (formData: ClearCutForm) => {
		dispatch(
			submitClearCutFormThunk({
				reportId: clearCut.report.id,
				formData,
			}),
		);
	};

	useEffect(() => {
		if (submission.status === "success") {
			toast({ title: "Formulaire modifié" });
		} else if (submission.status === "error") {
			toast({ title: "Erreur lors de la sauvegarde du formulaire !" });
		}
	}, [submission.status, toast]);

	return (
		<>
			<AccordionHeader
				form={form}
				tags={clearCut.report.rules}
				status={clearCut.report.status}
			/>
			<FormProvider {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="p-1 flex flex-col grow px-4 h-0"
				>
					<Accordion.Root type="multiple" className="grow overflow-auto">
						<AccordionContent form={form} />
					</Accordion.Root>
					{!!loggedUser && (
						<Button
							type="submit"
							className="mx-auto my-1 text-xl font-bold cursor-pointer"
							size="lg"
							disabled={submission.status === "loading"}
						>
							{submission.status === "loading"
								? "Envoi en cours..."
								: "Valider"}
						</Button>
					)}
				</form>
			</FormProvider>
		</>
	);
}
