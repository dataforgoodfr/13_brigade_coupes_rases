import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "@tanstack/react-router"
import { SendIcon } from "lucide-react"
import { useEffect } from "react"
import { FormProvider, useForm } from "react-hook-form"

import largeLogo from "@/assets/logo-lg.png"
import { Button } from "@/components/ui/button"
import {
	type ForgotPasswordRequest,
	forgotPasswordRequestSchema
} from "@/features/user/store/me"
import {
	forgotPasswordThunk,
	meSlice,
	selectForgotPassword
} from "@/features/user/store/me.slice"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/shared/components/input/Input"
import { Title } from "@/shared/components/typo/Title"
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/shared/form/components/Form"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"

export function ForgotPasswordForm() {
	const form = useForm<ForgotPasswordRequest>({
		resolver: zodResolver(forgotPasswordRequestSchema),
		defaultValues: { email: "" }
	})
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const forgotPasswordState = useAppSelector(selectForgotPassword)
	const { toast } = useToast()

	useEffect(() => {
		if (forgotPasswordState.status === "success") {
			toast({
				id: "forgot-success",
				title: "Email envoyé",
				variant: "success",
				description:
					"Si ce compte existe, un lien de réinitialisation vous a été envoyé par email."
			})
			navigate({ to: "/login" })
		} else if (forgotPasswordState.status === "error") {
			toast({
				id: "forgot-failed",
				title: "Erreur",
				description: "Erreur lors de la demande. Veuillez réessayer.",
				variant: "destructive"
			})
		}
		return () => {
			dispatch(meSlice.actions.resetForgotPassword())
		}
	}, [forgotPasswordState, toast, dispatch, navigate])

	return (
		<>
			<img alt="Canopée forêts vivantes" src={largeLogo} />
			<Title className="text-primary mt-4">Mot de passe oublié</Title>
			<h3 className="text-neutral-600 font-light">
				Entrez votre email pour réinitialiser votre mot de passe
			</h3>

			<FormProvider {...form}>
				<form
					onSubmit={form.handleSubmit((data) =>
						dispatch(forgotPasswordThunk(data))
					)}
					className="space-y-4 mt-4"
				>
					<FormField<ForgotPasswordRequest, "email">
						form={form}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input placeholder="jean.dupont@email.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						className="w-full"
						type="submit"
						disabled={
							!form.formState.isValid ||
							forgotPasswordState.status === "loading"
						}
					>
						<SendIcon />
						Envoyer le lien
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
