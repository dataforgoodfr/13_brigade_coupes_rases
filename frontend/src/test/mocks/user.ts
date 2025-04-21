import type { UserResponse } from "@/features/user/store/user";

export const volunteerMock = {
	role: "volunteer",
	departments: [],
	email: "volunteer@email.com",
	login: "volunteer",
} satisfies UserResponse;

export const adminMock = {
	role: "admin",
	departments: [],
	email: "admin@email.com",
	login: "admin",
} satisfies UserResponse;
