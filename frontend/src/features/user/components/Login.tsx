import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/shared/components/Button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/components/Form";
import { Input } from "@/shared/components/input/Input";

import {
	type LoginRequest,
	loginRequestSchema,
} from "@/features/user/store/user";
import { loginThunk } from "@/features/user/store/user.slice";
import { useAppDispatch } from "@/shared/hooks/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export function Login() {
	const form = useForm<LoginRequest>({
		resolver: zodResolver(loginRequestSchema),
		defaultValues: { email: "", password: "" },
	});
	const dispatch = useAppDispatch();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-2xl">Connexion</CardTitle>
				<CardDescription>
					Entrez votre email et mot de passe ci-dessous pour vous connecter
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((login) => dispatch(loginThunk(login)))}
						className="space-y-8"
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
									<FormDescription>Votre email</FormDescription>
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
										<Input
											autoComplete="current-password"
											type="password"
											placeholder=""
											{...field}
										/>
									</FormControl>
									<FormDescription>Votre mot de passe</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button className="w-full" type="submit">
							Se connecter
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
