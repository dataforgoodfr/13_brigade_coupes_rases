import type { UserResponse } from "@/features/user/store/user";

export const volunteerMock = {
	role: "volunteer",
	affectedDepartments: [],
	email: "volunteer@email.com",
	login: "volunteer",
} satisfies UserResponse;

export const anotherVolunteerMock = {
	role: "volunteer",
	affectedDepartments: [],
	email: "anotherVolunteer@email.com",
	login: "anotherVolunteer",
} satisfies UserResponse;

export const administratorMock = {
	role: "administrator",
	email: "administrator@email.com",
	login: "administrator",
} satisfies UserResponse;
