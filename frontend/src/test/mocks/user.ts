import type { UserResponse } from "@/features/user/store/user";

export const volunteerMock = {
	role: "volunteer",
	affectedDepartments: [],
	email: "volunteer@email.com",
	login: "volunteer",
} satisfies UserResponse;
