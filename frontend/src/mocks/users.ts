import type { LoginRequest, Role, User } from "@/features/user/store/user";
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

const fakeUsers = range(10, () => ({
	login: faker.internet.username(),
	email: faker.internet.email(),
	role: faker.helpers.arrayElement(["volunteer", "administrator", "visitor"]),
	avatarUrl: faker.image.avatar(),
	departments: [],
	region: faker.location.state(),
})) satisfies User[];

export const mockUsers = http.get("*/users", ({ request }) => {
	const url = new URL(request.url);
	const name = url.searchParams.get("name");
	const role = url.searchParams.get("role");
	const regionsParam = url.searchParams.get("regions");
	const regions = regionsParam ? regionsParam.split(",") : [];

	let users = fakeUsers;

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

		if (regions?.length)
			isValidUser = isValidUser && regions.some((r) => user.region === r);

		return isValidUser;
	});

	return HttpResponse.json({
		users,
	});
});
