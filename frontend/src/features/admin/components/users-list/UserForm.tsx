import { zodResolver } from "@hookform/resolvers/zod"
import { upperFirst } from "es-toolkit"
import type { ReactNode } from "react"
import { FormProvider, useForm } from "react-hook-form"

import {
	type UserForm as UserFormType,
	userFormSchema
} from "@/features/admin/store/users"
import { ROLES } from "@/features/user/store/me"
import { FormField } from "@/shared/form/components/Form"
import { FormCombobox } from "@/shared/form/components/FormCombobox"
import { FormInput } from "@/shared/form/components/FormInput"
import { FormSelect } from "@/shared/form/components/FormSelect"
import { type LabelledValue, namedIdTranslator } from "@/shared/items"
import { useSelectSelectableDepartments } from "@/shared/store/referential/referential.slice"

type Props = {
	user?: UserFormType
	header: ReactNode
	footer: ReactNode
	onSubmit: (user: UserFormType) => void
}

const AVAILABLE_ITEMS: LabelledValue[] = ROLES.map((r) => ({
	value: r,
	label: upperFirst(r)
}))

const formResolver = zodResolver(userFormSchema)

export function UserForm({ user, footer, header, onSubmit }: Props) {
	const departments = useSelectSelectableDepartments()
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
					departments: departments
				}
	})

	return (
		<FormProvider {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				{header}
				<div className="flex flex-col gap-2">
					<FormField<UserFormType>
						form={form}
						name={"firstName"}
						render={(props) => (
							<FormInput
								{...props}
								label="Prénom"
								type="text"
								disableChangeTracking
							/>
						)}
					/>
					<FormField<UserFormType>
						name={"lastName"}
						form={form}
						render={(props) => (
							<FormInput
								{...props}
								label="Nom"
								type="text"
								disableChangeTracking
							/>
						)}
					/>
					<FormField<UserFormType>
						form={form}
						name={"email"}
						render={(props) => (
							<FormInput
								{...props}
								label="Email"
								type="text"
								disableChangeTracking
							/>
						)}
					/>
					<FormField<UserFormType>
						form={form}
						name={"login"}
						render={(props) => (
							<FormInput
								{...props}
								label="Pseudo"
								type="text"
								disableChangeTracking
							/>
						)}
					/>
					<FormField<UserFormType>
						form={form}
						name={"role"}
						render={(props) => (
							<FormSelect
								{...props}
								availableValues={AVAILABLE_ITEMS}
								placeholder="Sélectionner un rôle"
								label="Rôle"
								disableChangeTracking
							/>
						)}
					/>
					<FormField<UserFormType, "departments">
						form={form}
						name="departments"
						render={(props) => (
							<FormCombobox
								{...props}
								countPreview
								buttonProps={{ className: "w-full justify-end" }}
								getItemLabel={namedIdTranslator}
								getItemValue={namedIdTranslator}
								hasInput
								type="multiple"
								label="Départements"
								disableChangeTracking
							/>
						)}
					/>
				</div>

				{footer}
			</form>
		</FormProvider>
	)
}
