import { fakerFR as faker } from "@faker-js/faker"
import { HttpResponse, http } from "msw"

import type {
	UserResponse as AdminUserResponse,
	PaginatedUsersResponse
} from "@/features/admin/store/users"
import type { MeResponse, TokenResponse } from "@/features/user/store/me"
import { fakeDepartments } from "@/mocks/referential"
import { range } from "@/shared/array"

const adminToken =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBleGFtcGxlLmNvbSIsImV4cCI6MTc0Mjc2NjQxMn0.-rl7wbmum8v5kmbeW2l67K6hxas62Y8N9UpHAC0-A58"
const volunteerToken =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2b2x1bnRlZXJAZXhhbXBsZS5jb20iLCJleHAiOjE3NDI4MDA0MDh9.eXwl9kBRFRxb_OjzfUkU2_jZwBJ23vFkYWKhXql2n24"

export const volunteerAssignedToken =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2b2x1bnRlZXItYXNzaWduZWRAZXhhbXBsZS5jb20iLCJleHAiOjE3NDQ0MDE1MzR9.PYc5hvIIuobVFt1TMb8EHdlK7iI5ZhsAqrOqKzFFAVw"
export const volunteerAssignedMock: MeResponse = {
	role: "volunteer",
	departments: [],
	email: "volunteer@example.com",
	login: "volunteerVolunteers",
	favorites: [],
	avatarUrl: faker.image.avatar()
}
export const adminMock: MeResponse = {
	role: "admin",
	email: "admin@example.com",
	login: "adminAdmin",
	favorites: [],
	avatarUrl: faker.image.avatar()
}
export const volunteerMock: MeResponse = {
	role: "volunteer",
	departments: [],
	email: "volunteer@example.com",
	login: "volunteerVolunteers",
	favorites: [],
	avatarUrl: faker.image.avatar()
}
export const mockMe = http.get("*/api/v1/me", async ({ request }) => {
	const token = request.headers.get("Authorization")
	if (token?.includes(adminToken)) {
		return HttpResponse.json(adminMock)
	}
	if (token?.includes(volunteerAssignedToken)) {
		return HttpResponse.json(volunteerAssignedMock)
	}
	return HttpResponse.json(volunteerMock)
})

export const mockToken = http.post("*/api/v1/token", async ({ request }) => {
	const formData = await request.formData()
	const email = formData.get("username")?.toString()
	let token = volunteerToken
	if (email?.includes("admin")) {
		token = adminToken
	}
	if (email?.includes("assigned")) {
		token = volunteerAssignedToken
	}
	return HttpResponse.json({
		accessToken: token,
		refreshToken: token
	} satisfies TokenResponse)
})

const fakeUsers: AdminUserResponse[] = range(10, () => ({
	id: faker.string.uuid(),
	firstName: faker.person.firstName(),
	lastName: faker.person.lastName(),
	role: faker.helpers.arrayElement(["admin", "volunteer"]),
	departments: faker.helpers.arrayElements(Object.keys(fakeDepartments)),
	login: faker.internet.username(),
	email: faker.internet.email()
}))

export const mockUsers = http.get("*/api/v1/users", ({ request }) => {
	const url = new URL(request.url)
	const name = url.searchParams.get("name")
	const roles = url.searchParams.getAll("roles")
	const page = Number.parseInt(url.searchParams.get("page") as string, 10)
	const size = Number.parseInt(url.searchParams.get("size") as string, 10)
	const departments_ids = url.searchParams.getAll("departments_ids")

	const users = fakeUsers.filter((user) => {
		let isValidUser = true
		if (name) {
			isValidUser &&=
				user.login.toLowerCase().includes(name.toLowerCase()) ||
				user.email.toLowerCase().includes(name.toLowerCase())
		}

		isValidUser &&= roles.length === 0 || roles.includes(user.role)

		isValidUser &&=
			departments_ids.length === 0 ||
			departments_ids.some((r) => user.departments?.includes(r))

		return isValidUser
	})

	return HttpResponse.json({
		content: users.slice(page * size, (page + 1) * size),
		metadata: {
			links: {},
			page: page,
			size: size,
			pagesCount: Math.ceil(users.length / size),
			totalCount: users.length
		}
	} satisfies PaginatedUsersResponse)
})
