import { fullUserSchema, roleSchema } from "@/features/user/store/user";
import { z } from "zod";

const filtersRequestSchema = z.object({
	name: z.string(),
	role: roleSchema.optional(),
	departments: z.array(z.string()),
});

export type FiltersRequest = z.infer<typeof filtersRequestSchema>;

export const usersListResponseSchema = z.object({
	users: z.array(fullUserSchema),
});

export type UsersListResponse = z.infer<typeof usersListResponseSchema>;
