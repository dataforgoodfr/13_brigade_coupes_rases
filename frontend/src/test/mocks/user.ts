import type { MeResponse } from "@/features/user/store/me";

export const volunteerMock = {
	role: "volunteer",
	departments: [],
	email: "volunteer@email.com",
	login: "volunteer",
} satisfies MeResponse;

export const adminMock = {
	role: "admin",
	departments: [],
	email: "admin@email.com",
	login: "admin",
} satisfies MeResponse;
