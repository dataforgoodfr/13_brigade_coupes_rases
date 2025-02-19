import type { LoginRequest, Role, User } from "@/features/user/store/user";
import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

export const mockLogin = http.post("*/login", async ({ request }) => {
	const { email } = (await request.json()) as LoginRequest;
	const login = email.split("@")[0];
	const avatarUrl = faker.image.avatar();
	if (email.includes("administrator" satisfies Role)) {
		return HttpResponse.json({
			role: "administrator",
			email,
			login,
			avatarUrl,
		} satisfies User);
	}
	return HttpResponse.json({
		role: "volunteer",
		departments: [],
		email,
		login,
		avatarUrl,
	} satisfies User);
});
