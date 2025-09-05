import { zodResolver } from "@hookform/resolvers/zod";
import { upperFirst } from "es-toolkit";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
	type UserForm as UserFormType,
	userFormSchema,
} from "@/features/admin/store/users";
import { ROLES } from "@/features/user/store/me";
import { FormCombobox } from "@/shared/components/form/FormCombobox";
import { FormInput } from "@/shared/components/form/FormInput";
import { FormSelect } from "@/shared/components/form/FormSelect";
import { type LabelledValue, namedIdTranslator } from "@/shared/items";
import { useSelectSelectableDepartments } from "@/shared/store/referential/referential.slice";

type Props = {
	user?: UserFormType;
	header: ReactNode;
	footer: ReactNode;
	onSubmit: (user: UserFormType) => void;
};
const AVAILABLE_ITEMS: LabelledValue[] = ROLES.map((r) => ({
	value: r,
	label: upperFirst(r),
}));
const formResolver = zodResolver(userFormSchema);
export function UserForm({ user, footer, header, onSubmit }: Props) {
	const departments = useSelectSelectableDepartments();
	const form = useForm({
		resolver: formResolver,
		values: user
			? user
			: {
					role: "volunteer" as const,
					email: "",
					firstName: "",
					lastName: "",
					login: "",
					departments: departments,
				},
	});

	return (
		<FormProvider {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				{header}
				<div className="flex flex-col gap-2">
					<FormInput
						control={form.control}
						label="Prénom"
						name="firstName"
						type="text"
					/>
					<FormInput
						control={form.control}
						label="Nom"
						name="lastName"
						type="text"
					/>
					<FormInput
						control={form.control}
						label="Email"
						name="email"
						type="email"
					/>
					<FormInput
						control={form.control}
						label="Pseudo"
						name="login"
						type="text"
					/>
					<FormSelect
						control={form.control}
						name="role"
						placeholder="Sélectionner un rôle"
						label="Rôle"
						availableValues={AVAILABLE_ITEMS}
					/>
					<FormCombobox
						countPreview
						buttonProps={{ className: "w-full justify-end" }}
						getItemLabel={namedIdTranslator}
						getItemValue={namedIdTranslator}
						hasInput
						type="multiple"
						control={form.control}
						label="Départements"
						name="departments"
					/>
				</div>

				{footer}
			</form>
		</FormProvider>
	);
}
