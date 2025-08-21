import { EditIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteUserDialog } from "@/features/admin/components/users-list/DeleteUserDialog";
import { UserForm } from "@/features/admin/components/users-list/UserForm";
import type { User } from "@/features/admin/store/users";
import {
	selectEditedUser,
	updateUserThunk,
	usersSlice,
} from "@/features/admin/store/users.slice";
import { useToast } from "@/hooks/use-toast";
import { IconButton } from "@/shared/components/button/Button";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { listToSelectableItems } from "@/shared/items";
import { selectDepartmentsByIdsDifferent } from "@/shared/store/referential/referential.slice";

const Header = () => (
	<DialogHeader>
		<DialogTitle>Modifier un utilisateur</DialogTitle>
		<DialogDescription>
			Modifiez les informations du bénévole ou administrateur puis enregistrez
			vos changements.
		</DialogDescription>
	</DialogHeader>
);
type FooterProps = { user: User; onDeleted: () => void };
const Footer = ({ user, onDeleted }: FooterProps) => {
	return (
		<DialogFooter className="mt-4 sm:justify-between">
			<DeleteUserDialog user={user} onDeleted={onDeleted} />
			<div className="sm:space-x-2">
				<DialogClose asChild>
					<Button variant="zinc">Annuler</Button>
				</DialogClose>
				<Button type="submit">Enregistrer</Button>
			</div>
		</DialogFooter>
	);
};

export function UpdateUserDialog(user: User) {
	const dispatch = useAppDispatch();
	const { toast } = useToast();
	const updatedUser = useAppSelector(selectEditedUser);
	const [isOpen, setIsOpen] = useState(false);
	const otherDepartments = useAppSelector((s) =>
		selectDepartmentsByIdsDifferent(
			s,
			user.departments.map((d) => d.id),
		),
	);

	const departments = useMemo(
		() => [
			...listToSelectableItems(user.departments, true),
			...listToSelectableItems(otherDepartments, false),
		],
		[user.departments, otherDepartments],
	);
	useEffect(() => {
		if (updatedUser.status === "success") {
			toast({ title: `Utilisateur ${updatedUser.value?.login} mis à jour` });
			setIsOpen(false);
			dispatch(usersSlice.actions.resetEditedUser());
		} else if (updatedUser.status === "error") {
			toast({
				title: "La mise à jour de l'utilisateur a échoué",
				description: updatedUser.error?.detail.content,
				variant: "destructive",
			});
		}
	}, [updatedUser, toast, dispatch]);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<IconButton variant="zinc" icon={<EditIcon />}></IconButton>
			</DialogTrigger>
			<DialogContent>
				<UserForm
					user={{ ...user, departments }}
					onSubmit={(form) =>
						dispatch(updateUserThunk({ id: user.id, ...form }))
					}
					header={<Header />}
					footer={<Footer user={user} onDeleted={() => setIsOpen(false)} />}
				></UserForm>
			</DialogContent>
		</Dialog>
	);
}
