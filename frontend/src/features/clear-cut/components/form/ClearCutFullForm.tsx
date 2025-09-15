import { zodResolver } from "@hookform/resolvers/zod";
import { isUndefined } from "es-toolkit";
import { Accordion } from "radix-ui";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	type ClearCutForm,
	type ClearCutFormVersions,
	clearCutFormSchema,
} from "@/features/clear-cut/store/clear-cuts";
import {
	persistClearCutCurrentForm,
	selectSubmission,
	submitClearCutFormThunk,
} from "@/features/clear-cut/store/clear-cuts-slice";
import { useConnectedMe, useMe } from "@/features/user/store/me.slice";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import AccordionContent from "./AccordionContent";
import { AccordionHeader } from "./AccordionHeader";

type Props = ClearCutFormVersions;
export function ClearCutFullForm({ current, original }: Props) {
	const dispatch = useAppDispatch();
	const submission = useAppSelector(selectSubmission);
	const loggedUser = useMe();
	const user = useConnectedMe();
	const isDisabled = useMemo(() => {
		if (!user) return true;

		if (user.role === "volunteer") {
			return (
				(!current.report.affectedUser ||
					current.report.affectedUser.login !== user.login) ??
				false
			);
		}

		return false;
	}, [user, current.report.affectedUser]);
	const form = useForm({
		resolver: zodResolver(clearCutFormSchema),
		values: current,
		defaultValues: original,
		disabled: isDisabled,
	});

	useEffect(() => {
		form.watch((values) => {
			const clearCutForm = clearCutFormSchema.safeParse(values).data;
			if (!isUndefined(clearCutForm)) {
				dispatch(persistClearCutCurrentForm(clearCutForm));
			}
		});
	}, [form, dispatch]);

	const { toast } = useToast();

	const handleSubmit = (formData: ClearCutForm) => {
		dispatch(
			submitClearCutFormThunk({
				reportId: current.report.id,
				formData,
			}),
		);
	};

	useEffect(() => {
		if (submission.status === "success") {
			toast({ id: "edited-form", title: "Formulaire modifié" });
		} else if (submission.status === "error") {
			toast({
				id: "form-edition-error",
				title: "Erreur lors de la sauvegarde du formulaire !",
			});
		}
	}, [submission.status, toast]);

	return (
		<>
			<AccordionHeader
				form={form}
				tags={current.report.rules}
				status={current.report.status}
			/>
			<FormProvider {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="p-1 flex flex-col grow px-4 h-0"
				>
					<Accordion.Root type="multiple" className="grow overflow-auto">
						<AccordionContent original={original} form={form} />
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
