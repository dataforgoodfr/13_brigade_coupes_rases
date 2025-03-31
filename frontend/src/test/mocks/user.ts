import type { UserResponse } from "@/features/user/store/user";

export const volunteerMock = {
	role: "volunteer",
	departments: [],
	email: "volunteer@email.com",
	login: "volunteer",
} satisfies UserResponse;
