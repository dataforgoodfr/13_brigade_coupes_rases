import type {
	LoginRequest,
	Role,
	UserResponse,
} from "@/features/user/store/user";
import { range } from "@/shared/array";
import { fakerFR as faker } from "@faker-js/faker";

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
		} satisfies UserResponse);
	}
	return HttpResponse.json({
		role: "volunteer",
		affectedDepartments: [],
		email,
		login,
		avatarUrl,
	} satisfies UserResponse);
});

const fakeUsers: UserResponse[] = range(100, () => ({
	login: faker.internet.username(),
	email: faker.internet.email(),
	...faker.helpers.arrayElement([
		{
			role: "volunteer",
			affectedDepartments: range(2, () => faker.location.state()),
		},
		{ role: "administrator" },
	]),
	avatarUrl: faker.image.avatar(),
}));

export const mockUsers = http.get("*/users", ({ request }) => {
	const url = new URL(request.url);
	const name = url.searchParams.get("name");
	const role = url.searchParams.get("role");
	const departmentsParam = url.searchParams.get("departments");
	const departments = departmentsParam ? departmentsParam.split(",") : [];

	let users = fakeUsers;

	// TODO: all filters and pagination from backend
	users = users.filter((user) => {
		let isValidUser = true;

		if (name)
			isValidUser =
				(isValidUser &&
					// For testing purposes, basic filter users by name or email TODO: unaccent
					user.login
						.toLowerCase()
						.includes(name.toLowerCase() || "")) ||
				user.email.toLowerCase().includes(name.toLowerCase() || "");

		if (role) isValidUser = isValidUser && user.role === role;

		if (departments?.length)
			isValidUser =
				isValidUser &&
				user.role === "volunteer" &&
				departments.some((r) => user?.affectedDepartments?.includes(r));

		return isValidUser;
	});

	return HttpResponse.json({
		users,
	});
});
