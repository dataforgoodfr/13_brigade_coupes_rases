import type { TokenResponse, UserResponse } from "@/features/user/store/user";
import { range } from "@/shared/array";
import { fakerFR as faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";
const adminToken =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBleGFtcGxlLmNvbSIsImV4cCI6MTc0Mjc2NjQxMn0.-rl7wbmum8v5kmbeW2l67K6hxas62Y8N9UpHAC0-A58";
const volunteerToken =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2b2x1bnRlZXJAZXhhbXBsZS5jb20iLCJleHAiOjE3NDI4MDA0MDh9.eXwl9kBRFRxb_OjzfUkU2_jZwBJ23vFkYWKhXql2n24";

export const volunteerAssignedToken =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2b2x1bnRlZXItYXNzaWduZWRAZXhhbXBsZS5jb20iLCJleHAiOjE3NDQ0MDE1MzR9.PYc5hvIIuobVFt1TMb8EHdlK7iI5ZhsAqrOqKzFFAVw";
export const mockMe = http.get("*/api/v1/me", async ({ request }) => {
	const token = request.headers.get("Authorization");
	const avatarUrl = faker.image.avatar();
	if (token?.includes(adminToken)) {
		return HttpResponse.json({
			role: "admin",
			email: "admin@example.com",
			login: "adminAdmin",
			avatarUrl,
		} satisfies UserResponse);
	}
	if (token?.includes(volunteerAssignedToken)) {
		return HttpResponse.json({
			role: "volunteer",
			email: "volunteer-assigned@example.com",
			login: "assignedVolunteer",
			avatarUrl,
		} satisfies UserResponse);
	}
	return HttpResponse.json({
		role: "volunteer",
		departments: [],
		email: "volunteer@example.com",
		login: "volunteerVolunteers",
		avatarUrl,
	} satisfies UserResponse);
});

export const mockToken = http.post("*/api/v1/token", async ({ request }) => {
	const formData = await request.formData();
	const email = formData.get("username")?.toString();
	let token = volunteerToken;
	if (email?.includes("admin")) {
		token = adminToken;
	}
	if (email?.includes("assigned")) {
		token = volunteerAssignedToken;
	}
	return HttpResponse.json({
		access_token: token,
	} satisfies TokenResponse);
});

const fakeUsers: UserResponse[] = range(10, () => ({
	login: faker.internet.username(),
	email: faker.internet.email(),
	...faker.helpers.arrayElement([
		{ role: "volunteer", affectedDepartments: [] },
		{ role: "admin" },
	]),
	avatarUrl: faker.image.avatar(),
}));

export const mockUsers = http.get("*/api/v1/users", ({ request }) => {
	const url = new URL(request.url);
	const name = url.searchParams.get("name");
	const role = url.searchParams.get("role");
	const departmentsParam = url.searchParams.get("departments");
	const departments = departmentsParam ? departmentsParam.split(",") : [];

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

		if (departments?.length && user.role === "volunteer")
			isValidUser =
				isValidUser && departments.some((r) => user?.departments?.includes(r));

		return isValidUser;
	});

	return HttpResponse.json({
		users,
	});
});
