import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog"
import type { User } from "@/features/admin/store/users"
import {
	deleteUserThunk,
	selectDeletedUser,
	usersSlice
} from "@/features/admin/store/users.slice"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"

type Props = { user: User; onDeleted: () => void }

export function DeleteUserDialog({ user, onDeleted }: Props) {
	const dispatch = useAppDispatch()
	const { toast } = useToast()
	const deletedUser = useAppSelector(selectDeletedUser)
	const [isOpen, setIsOpen] = useState(false)
	useEffect(() => {
		if (deletedUser.status === "success") {
			toast({
				id: "user-deleted",
				title: `Utilisateur ${user.login} supprimé`
			})
			setIsOpen(false)
			onDeleted()
			dispatch(usersSlice.actions.resetDeletedUser())
		} else if (deletedUser.status === "error") {
			toast({
				id: "user-deletion-failed",
				title: "La suppression de l'utilisateur a échoué",
				description: deletedUser.error?.detail.content,
				variant: "destructive"
			})
		}
	}, [user.login, deletedUser, toast, onDeleted, dispatch])
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="destructive">Supprimer</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Supprimer un utilisateur</DialogTitle>
					<DialogDescription>
						Êtes-vous sûr(e) de vouloir supprimer cet utilisateur ?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="zinc">Annuler</Button>
					</DialogClose>
					<Button
						variant="destructive"
						onClick={() => dispatch(deleteUserThunk(user.id))}
					>
						Supprimer
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
