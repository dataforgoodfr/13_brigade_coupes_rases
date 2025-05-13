import { roleSchema } from "@/features/user/store/user";
import { z } from "zod";

const usersRequestSchema = z.object({
	id: z.string(),
	login: z.string(),
	email: z.string(),
	firstname: z.string(),
	lastname: z.string(),
	role: roleSchema.optional(),
	departments: z.array(z.string()),
});

export type User = z.infer<typeof usersRequestSchema>;

export const usersListResponseSchema = z.object({
	users: z.array(usersRequestSchema),
});

export type UsersListResponse = z.infer<typeof usersListResponseSchema>;
