import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "@tanstack/react-router"
import { LockIcon } from "lucide-react"
import { useEffect } from "react"
import { FormProvider, useForm } from "react-hook-form"

import largeLogo from "@/assets/logo-lg.png"
import { Button } from "@/components/ui/button"
import {
	type ResetPasswordRequest,
	resetPasswordRequestSchema
} from "@/features/user/store/me"
import {
	meSlice,
	resetPasswordThunk,
	selectResetPassword
} from "@/features/user/store/me.slice"
import { useToast } from "@/hooks/use-toast"
import { PasswordInput } from "@/shared/components/input/PasswordInput"
import { Title } from "@/shared/components/typo/Title"
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/shared/form/components/Form"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"

export function ResetPasswordForm({ token }: { token: string }) {
	const form = useForm<ResetPasswordRequest>({
		resolver: zodResolver(resetPasswordRequestSchema),
		defaultValues: { token, new_password: "" }
	})
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const resetPasswordState = useAppSelector(selectResetPassword)
	const { toast } = useToast()

	useEffect(() => {
		if (resetPasswordState.status === "success") {
			toast({
				id: "reset-success",
				title: "Mot de passe modifié",
				variant: "success",
				description: "Votre mot de passe a été réinitialisé avec succès."
			})
			navigate({ to: "/login" })
		} else if (resetPasswordState.status === "error") {
			toast({
				id: "reset-failed",
				title: "Erreur",
				description: "Le lien est invalide ou expiré.",
				variant: "destructive"
			})
		}
		return () => {
			dispatch(meSlice.actions.resetResetPassword())
		}
	}, [resetPasswordState, toast, dispatch, navigate])

	return (
		<>
			<img alt="Canopée forêts vivantes" src={largeLogo} />
			<Title className="text-primary mt-4">Nouveau mot de passe</Title>
			<h3 className="text-neutral-600 font-light">
				Définissez votre nouveau mot de passe
			</h3>

			<FormProvider {...form}>
				<form
					onSubmit={form.handleSubmit((data) =>
						dispatch(resetPasswordThunk(data))
					)}
					className="space-y-4 mt-4"
				>
					<FormField<ResetPasswordRequest, "new_password">
						form={form}
						name="new_password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nouveau mot de passe</FormLabel>
								<FormControl>
									<PasswordInput
										autoComplete="new-password"
										placeholder=""
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						className="w-full"
						type="submit"
						disabled={
							!form.formState.isValid || resetPasswordState.status === "loading"
						}
					>
						<LockIcon />
						Valider
					</Button>
				</form>
			</FormProvider>

			<div className="mt-6 text-center text-sm">
				<Link
					to="/login"
					className="text-primary hover:underline font-semibold"
				>
					Retour à la connexion
				</Link>
			</div>
		</>
	)
}
