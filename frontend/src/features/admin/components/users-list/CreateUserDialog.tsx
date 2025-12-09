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
import { UserForm } from "@/features/admin/components/users-list/UserForm"
import {
	createUserThunk,
	selectEditedUser,
	usersSlice
} from "@/features/admin/store/users.slice"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"

const Header = () => (
	<DialogHeader>
		<DialogTitle>Ajouter un utilisateur</DialogTitle>
		<DialogDescription>
			Ajoutez un nouveau bénévole ou administrateur en remplissant les
			informations ci-dessous.
		</DialogDescription>
	</DialogHeader>
)

const Footer = () => (
	<DialogFooter className="mt-4">
		<DialogClose asChild>
			<Button variant="zinc">Annuler</Button>
		</DialogClose>
		<Button type="submit">Enregistrer</Button>
	</DialogFooter>
)

export function CreateUserDialog() {
	const dispatch = useAppDispatch()
	const { toast } = useToast()
	const createdUser = useAppSelector(selectEditedUser)
	const [isOpen, setIsOpen] = useState(false)
	useEffect(() => {
		if (createdUser.status === "success") {
			toast({
				id: "user-created",
				title: `Utilisateur ${createdUser.value?.login} créé`
			})
			setIsOpen(false)
			dispatch(usersSlice.actions.resetEditedUser())
		} else if (createdUser.status === "error") {
			toast({
				id: "user-creation-failed",
				title: "La création de l'utilisateur a échoué",
				description: createdUser.error?.detail.content,
				variant: "destructive"
			})
		}
	}, [createdUser, toast, dispatch])
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button>Ajouter</Button>
			</DialogTrigger>
			<DialogContent>
				<UserForm
					onSubmit={(form) => dispatch(createUserThunk(form))}
					header={<Header />}
					footer={<Footer />}
				></UserForm>
			</DialogContent>
		</Dialog>
	)
}
