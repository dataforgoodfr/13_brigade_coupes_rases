import { isEqual } from "es-toolkit";
import { createContext, useContext, useEffect } from "react";
import {
	type FieldValues,
	get,
	type Path,
	type UseFormReturn,
} from "react-hook-form";
import type { FormType } from "@/shared/form/Form";

type Options<Form extends FieldValues> = {
	form: UseFormReturn<Form>;
	defaultValues: Form;
	excludedPaths?: Path<Form>[];
};
export function useTriggerForm<Form extends FieldValues>({
	form,
	defaultValues,
	excludedPaths,
}: Options<Form>) {
	useEffect(() => {
		for (const [key, value] of Object.entries(form.getValues())) {
			const path = key as Path<Form>;
			const defaultValue = get(defaultValues, path);
			if (excludedPaths?.includes(path) || isEqual(defaultValue, value))
				continue;
			form.setValue(path, value, {
				shouldDirty: true,
			});
		}
	}, [form, defaultValues, excludedPaths]);
}

export type AppFormContextType<Form extends FieldValues = FieldValues> = {
	form: FormType<Form>;
	originalForm: Form;
};
const AppFormContext = createContext<AppFormContextType>(
	undefined as unknown as AppFormContextType,
);


export function AppFormProvider<Form extends FieldValues>({
	form,
	originalForm,
	children,
}: {
	form: FormType<Form>;
	originalForm: Form;
	children: React.ReactNode;
}) {
	return (
		<AppFormContext.Provider
			value={{ form, originalForm } as AppFormContextType}
		>
			{children}
		</AppFormContext.Provider>
	);
}

export const useAppForm = <Form extends FieldValues = FieldValues>() =>
	useContext(AppFormContext) as AppFormContextType<Form>;
