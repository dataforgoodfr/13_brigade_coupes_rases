import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { LogInIcon } from "lucide-react"
import { useEffect } from "react"
import { FormProvider, useForm } from "react-hook-form"

import largeLogo from "@/assets/logo-lg.png"
import { Button } from "@/components/ui/button"
import { type LoginRequest, loginRequestSchema } from "@/features/user/store/me"
import {
	loginThunk,
	meSlice,
	selectLogin
} from "@/features/user/store/me.slice"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/shared/components/input/Input"
import { PasswordInput } from "@/shared/components/input/PasswordInput"
import { ToggleGroup } from "@/shared/components/toggle-group/ToggleGroup"
import { Title } from "@/shared/components/typo/Title"
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/shared/form/components/Form"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import { type SelectableItemEnhanced, useSingleSelect } from "@/shared/items"

type AuthenticationType = "password" | "sso"

export function LoginForm() {
	const form = useForm<LoginRequest>({
		resolver: zodResolver(loginRequestSchema),
		defaultValues: { email: "", password: "" }
	})
	const dispatch = useAppDispatch()
	const [authenticationType, authenticationTypes, setAuthenticationType] =
		useSingleSelect<
			AuthenticationType,
			SelectableItemEnhanced<AuthenticationType>
		>([
			{
				isSelected: true,
				item: "password",
				label: "Mot de passe",
				value: "password"
			},
			{ isSelected: false, item: "sso", label: "SSO", value: "sso" }
		])
	const login = useAppSelector(selectLogin)
	const { toast } = useToast()
	useEffect(() => {
		if (login.status === "success") {
			toast({
				id: "login-success",
				title: "Connexion réussie",
				variant: "success",
				description: "Vous êtes maintenant connecté."
			})
		} else if (login.status === "error") {
			const isInactive = (login.error?.detail as { type: string } | undefined)?.type === "USER_INACTIVE"
			toast({
				id: "login-failed",
				title: isInactive ? "Compte en attente" : "Erreur de connexion",
				description: isInactive
					? login.error?.detail.content
					: "Identifiants invalides. Veuillez réessayer.",
				variant: isInactive ? "default" : "destructive"
			})
		}
		return () => {
			dispatch(meSlice.actions.resetLogin())
		}
	}, [login, toast, dispatch])
	return (
		<>
			<img alt="Canopée forêts vivantes" src={largeLogo} />
			<Title className=" text-primary">Connexion</Title>
			<h3 className="text-neutral-600 font-light">
				Merci de saisir vos identifiants
			</h3>
			<ToggleGroup
				className="mt-4 flex  flex-row  w-full"
				type="single"
				value={authenticationTypes}
				itemProps={{ className: "basis-1/2" }}
				allowEmptyValue={false}
				onValueChange={setAuthenticationType}
			/>
			{authenticationType?.item === "password" && (
				<FormProvider {...form}>
					<form
						onSubmit={form.handleSubmit((login) => dispatch(loginThunk(login)))}
						className="space-y-4 mt-4"
					>
						<FormField<LoginRequest, "email">
							form={form}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="john.doe@email.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField<LoginRequest, "password">
							form={form}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Mot de passe</FormLabel>
									<FormControl>
										<PasswordInput
											autoComplete="current-password"
											placeholder=""
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end !mt-1">
							<Link
								to="/forgot-password"
								className="text-xs text-primary hover:underline"
							>
								Mot de passe oublié ?
							</Link>
						</div>
						<Button
							className="w-full"
							type="submit"
							disabled={!form.formState.isValid}
						>
							<LogInIcon />
							Connexion
						</Button>
					</form>
				</FormProvider>
			)}
			<div className="mt-6 text-center text-sm">
				Pas encore de compte ?{" "}
				<Link
					to="/register"
					className="text-primary hover:underline font-semibold"
				>
					S'inscrire
				</Link>
			</div>
		</>
	)
}
