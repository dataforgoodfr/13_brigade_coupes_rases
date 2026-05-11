import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "@tanstack/react-router"
import { LogInIcon } from "lucide-react"
import { useEffect } from "react"
import { FormProvider, useForm } from "react-hook-form"

import largeLogo from "@/assets/logo-lg.png"
import { Button } from "@/components/ui/button"
import {
	type RegisterRequest,
	registerRequestSchema
} from "@/features/user/store/me"
import {
	meSlice,
	registerThunk,
	selectRegister
} from "@/features/user/store/me.slice"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/shared/components/input/Input"
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

export function RegisterForm() {
	const form = useForm<RegisterRequest>({
		resolver: zodResolver(registerRequestSchema),
		defaultValues: {
			first_name: "",
			last_name: "",
			login: "",
			email: "",
			password: ""
		}
	})
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const registerState = useAppSelector(selectRegister)
	const { toast } = useToast()

	useEffect(() => {
		if (registerState.status === "success") {
			toast({
				id: "register-success",
				title: "Compte créé",
				variant: "success",
				description:
					"Votre compte a été créé. Il est en attente de validation par un administrateur."
			})
			navigate({ to: "/login" })
		} else if (registerState.status === "error") {
			toast({
				id: "register-failed",
				title: "Erreur d'inscription",
				description:
					"Erreur lors de la création du compte. Vérifiez les informations.",
				variant: "destructive"
			})
		}
		return () => {
			dispatch(meSlice.actions.resetRegister())
		}
	}, [registerState, toast, dispatch, navigate])

	return (
		<>
			<img alt="Canopée forêts vivantes" src={largeLogo} />
			<Title className="text-primary mt-4">Inscription</Title>
			<h3 className="text-neutral-600 font-light">
				Créez votre compte bénévole
			</h3>

			<FormProvider {...form}>
				<form
					onSubmit={form.handleSubmit((data) => dispatch(registerThunk(data)))}
					className="space-y-4 mt-4"
				>
					<div className="flex gap-4">
						<FormField<RegisterRequest, "first_name">
							form={form}
							name="first_name"
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel>Prénom</FormLabel>
									<FormControl>
										<Input placeholder="Jean" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField<RegisterRequest, "last_name">
							form={form}
							name="last_name"
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel>Nom</FormLabel>
									<FormControl>
										<Input placeholder="Dupont" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<FormField<RegisterRequest, "login">
						form={form}
						name="login"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Identifiant (Login)</FormLabel>
								<FormControl>
									<Input placeholder="jeandupont" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField<RegisterRequest, "email">
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
					<FormField<RegisterRequest, "password">
						form={form}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Mot de passe</FormLabel>
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
							!form.formState.isValid || registerState.status === "loading"
						}
					>
						<LogInIcon />
						S'inscrire
					</Button>
				</form>
			</FormProvider>

			<div className="mt-6 text-center text-sm">
				Déjà un compte ?{" "}
				<Link
					to="/login"
					className="text-primary hover:underline font-semibold"
				>
					Se connecter
				</Link>
			</div>
		</>
	)
}
