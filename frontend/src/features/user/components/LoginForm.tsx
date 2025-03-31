import largeLogo from "@/assets/logo-lg.png";
import { Button } from "@/components/ui/button";
import {
	type LoginRequest,
	loginRequestSchema,
} from "@/features/user/store/user";
import { loginThunk } from "@/features/user/store/user.slice";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/components/form/Form";
import { Input } from "@/shared/components/input/Input";
import { PasswordInput } from "@/shared/components/input/PasswordInput";
import { ToggleGroup } from "@/shared/components/toggle-group/ToggleGroup";
import { useAppDispatch } from "@/shared/hooks/store";
import { type SelectableItemEnhanced, useSingleSelect } from "@/shared/items";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogInIcon } from "lucide-react";
import { useForm } from "react-hook-form";

type AuthenticationType = "password" | "sso";
export function LoginForm() {
	const form = useForm<LoginRequest>({
		resolver: zodResolver(loginRequestSchema),
		defaultValues: { email: "", password: "" },
	});
	const dispatch = useAppDispatch();
	const [authenticationType, authenticationTypes, setAuthenticationType] =
		useSingleSelect<
			AuthenticationType,
			SelectableItemEnhanced<AuthenticationType>
		>([
			{
				isSelected: true,
				item: "password",
				label: "Mot de passe",
				value: "password",
			},
			{ isSelected: false, item: "sso", label: "SSO", value: "sso" },
		]);
	return (
		<>
			<img alt="Canopée forêts vivantes" src={largeLogo} />
			<h1 className="text-2xl font-poppins font-semibold text-primary">
				Connexion
			</h1>
			<h3 className="text-neutral-600 font-light">
				Merci de saisir vos identifiants
			</h3>
			<ToggleGroup
				className="mt-4 flex  flex-row  w-full"
				type="single"
				value={authenticationTypes}
				itemProps={{ className: "basis-1/2" }}
				onValueChange={setAuthenticationType}
			/>
			{authenticationType?.item === "password" ? (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((login) => dispatch(loginThunk(login)))}
						className="space-y-4 mt-4"
					>
						<FormField
							control={form.control}
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
						<FormField
							control={form.control}
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
						<Button
							className="w-full"
							type="submit"
							disabled={!form.formState.isValid}
						>
							<LogInIcon />
							Connexion
						</Button>
					</form>
				</Form>
			) : (
				<></>
			)}
		</>
	);
}
