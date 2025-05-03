import { Button } from "@/components/ui/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { UserWithDepartments } from "@/features/admin/components/users-list/UsersList";
import DepartmentsMultiSelect from "@/features/admin/components/users-list/insert-user-modal/DepartmentsMultiSelect";
import {
	selectPage,
	selectSize,
} from "@/features/admin/store/users-filters.slice";
import {
	createUserThunk,
	getUsersThunk,
	updateUserThunk,
} from "@/features/admin/store/users.slice";
import { ROLES } from "@/features/user/store/user";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/Select";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/components/form/Form";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const userFormSchema = z.object({
	firstname: z.string().min(1, "Prénom requis"),
	lastname: z.string().min(1, "Nom requis"),
	email: z.string().email("Email invalide"),
	role: z.enum(ROLES),
	departments: z
		.array(
			z.object({
				label: z.string(),
				value: z.string(),
			}),
		)
		.optional(),
});

export type UserForm = z.infer<typeof userFormSchema>;

type InsertUserModalProps = {
	user?: UserWithDepartments;
	onClose: () => void;
};

const InsertUserModal: React.FC<InsertUserModalProps> = ({ user, onClose }) => {
	const dispatch = useAppDispatch();

	const page = useAppSelector(selectPage);
	const size = useAppSelector(selectSize);

	const defaultValues = useMemo(() => {
		return {
			...user,
			role: user?.role as "volunteer" | "admin" | undefined,
			departments: user?.departments?.map((dept) => ({
				value: dept.id,
				label: dept.name,
			})),
		};
	}, [user]);

	const form = useForm<UserForm>({
		resolver: zodResolver(userFormSchema),
		defaultValues: user ? defaultValues : undefined,
	});

	useEffect(() => {
		form.reset(defaultValues);
	}, [defaultValues, form.reset]);

	const onSubmit = (data: UserForm) => {
		const insertFunction = user?.id ? updateUserThunk : createUserThunk;

		dispatch(
			insertFunction({
				...data,
				id: user?.id ?? "",
				departments: data.departments?.map((dept) => dept.value) ?? [],
				login: `${data.firstname}.${data.lastname}`,
			}),
		).then(() => {
			dispatch(
				getUsersThunk({
					page,
					size,
				}),
			);
		});

		onClose();
	};

	return (
		<DialogContent className="xl">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<DialogHeader>
						<DialogTitle>
							{user ? "Modifier un utilisateur" : "Ajouter un utilisateur"}
						</DialogTitle>
						<DialogDescription>
							Ajoutez un nouveau bénévole ou administrateur en remplissant les
							informations ci-dessous.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<FormField
							control={form.control}
							name="firstname"
							render={({ field }) => (
								<div>
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">Prénom</FormLabel>
										<FormControl>
											<Input
												className="col-span-3"
												placeholder="Entrez le prénom"
												{...field}
											/>
										</FormControl>
									</FormItem>
									<FormMessage className="flex justify-end" />
								</div>
							)}
						/>

						<FormField
							control={form.control}
							name="lastname"
							render={({ field }) => (
								<div>
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">Nom</FormLabel>
										<FormControl>
											<Input
												className="col-span-3"
												placeholder="Entrez le nom"
												{...field}
											/>
										</FormControl>
									</FormItem>
									<FormMessage className="flex justify-end" />
								</div>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<div>
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">Email</FormLabel>
										<FormControl>
											<Input
												className="col-span-3"
												placeholder="Entrez l'email"
												{...field}
											/>
										</FormControl>
									</FormItem>
									<FormMessage className="flex justify-end" />
								</div>
							)}
						/>

						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<div>
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">Rôle</FormLabel>
										<FormControl>
											<Select {...field} onValueChange={field.onChange}>
												<SelectTrigger id="role" className="col-span-3">
													<SelectValue placeholder="Sélectionnez le rôle" />
												</SelectTrigger>

												<SelectContent>
													{ROLES.map((role) => {
														return (
															<SelectItem key={role} value={role}>
																{role}
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
									<FormMessage className="flex justify-end" />
								</div>
							)}
						/>

						<FormField
							control={form.control}
							name="departments"
							render={({ field }) => (
								<div>
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">Départements</FormLabel>
										<FormControl>
											<div className="col-span-3">
												<DepartmentsMultiSelect {...field} />
											</div>
										</FormControl>
									</FormItem>
									<FormMessage className="flex justify-end" />
								</div>
							)}
						/>
					</div>

					<DialogFooter>
						<Button onClick={onClose} variant="white">
							Annuler
						</Button>
						<Button type="submit">Save changes</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
};

export default InsertUserModal;
