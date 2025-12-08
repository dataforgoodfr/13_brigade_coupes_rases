import { z } from "zod"

import { roleSchema } from "@/features/user/store/me"
import { toStringApiErrorSchema } from "@/shared/api/api"
import { paginationResponseSchema } from "@/shared/api/types"
import { toSelectableItemSchema } from "@/shared/items"
import { departmentSchema } from "@/shared/store/referential/referential"

export const userResponseSchema = z.object({
	id: z.string(),
	login: z.string().min(1),
	email: z.email(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	role: roleSchema,
	departments: z.array(z.string())
})

export const editUserRequestSchema = userResponseSchema.omit({ id: true })

export type EditUserRequest = z.infer<typeof editUserRequestSchema>

export const userFormSchema = userResponseSchema
	.omit({
		id: true
	})
	.extend({
		departments: toSelectableItemSchema(departmentSchema).array()
	})

export type UserForm = z.infer<typeof userFormSchema>

export type UserResponse = z.infer<typeof userResponseSchema>

export const paginatedUsersResponseSchema =
	paginationResponseSchema(userResponseSchema)

export type PaginatedUsersResponse = z.infer<
	typeof paginatedUsersResponseSchema
>

const userSchema = userResponseSchema
	.omit({ departments: true })
	.and(z.object({ departments: departmentSchema.array() }))

export type User = z.infer<typeof userSchema>

export const paginatedUsersSchema = paginationResponseSchema(userSchema)

export type PaginatedUsers = z.infer<typeof paginatedUsersSchema>

export const userAlreadyExistsErrorSchema = toStringApiErrorSchema(
	z.literal("USER_ALREADY_EXISTS")
)
export const userNotFoundErrorSchema = toStringApiErrorSchema(
	z.literal("USER_NOT_FOUND")
)

export type UserAlreadyExistsError = z.infer<
	typeof userAlreadyExistsErrorSchema
>

export type UserNotFoundError = z.infer<typeof userNotFoundErrorSchema>
