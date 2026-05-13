import type { MeResponse } from "@/features/user/store/me"

export const volunteerMock = {
	id: "volunteer-id",
	role: "volunteer",
	departments: [],
	email: "volunteer@email.com",
	login: "volunteer",
	favorites: []
} satisfies MeResponse

export const adminMock = {
	id: "admin-id",
	role: "admin",
	departments: [],
	email: "admin@email.com",
	login: "admin",
	favorites: []
} satisfies MeResponse
