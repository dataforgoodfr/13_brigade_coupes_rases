import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

type Options = { user: UserEvent };
export function loginForm({ user }: Options) {
	const setEmail = async (email: string) => {
		await user.type(await screen.findByText<HTMLInputElement>("Email"), email);
	};
	const setPassword = async (password: string) => {
		await user.type(
			await screen.findByLabelText<HTMLInputElement>("Mot de passe"),
			password,
		);
	};
	const submitForm = async () => {
		const logButton = await screen.findByText("Connexion", {
			exact: false,
			selector: "button",
		});
		await user.click(logButton);
	};
	const login = async (email: string, password: string) => {
		await setEmail(email);
		await setPassword(password);
		await submitForm();
	};
	const logVolunteer = async () => {
		await login("volunteer@email.com", "password");
	};
	const logAdministrator = async () => {
		await login("administrator@email.com", "password");
	};
	return {
		setEmail,
		setPassword,
		submitForm,
		login,
		logVolunteer,
		logAdministrator,
	};
}
