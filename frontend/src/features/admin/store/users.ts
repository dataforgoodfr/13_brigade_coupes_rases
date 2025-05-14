import { roleSchema } from "@/features/user/store/user";
import { paginationResponseSchema } from "@/shared/api/types";
import { departmentSchema } from "@/shared/store/referential/referential";
import { z } from "zod";

const userResponseSchema = z.object({
	id: z.string(),
	login: z.string(),
	email: z.string(),
	firstname: z.string(),
	lastname: z.string(),
	role: roleSchema.optional(),
	departments_ids: z.array(z.string()),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
export const paginatedUsersResponseSchema =
	paginationResponseSchema(userResponseSchema);
export type PaginatedUsersResponse = z.infer<
	typeof paginatedUsersResponseSchema
>;

const userSchema = userResponseSchema
	.omit({ departments_ids: true })
	.and(z.object({ departments: departmentSchema.array() }));
export type User = z.infer<typeof userSchema>;
export const paginatedUsersSchema = paginationResponseSchema(userSchema);
export type PaginatedUsers = z.infer<typeof paginatedUsersSchema>;
