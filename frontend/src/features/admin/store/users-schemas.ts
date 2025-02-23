import { roleSchema, userSchema } from "@/features/user/store/user";
import { z } from "zod";

const filtersRequestSchema = z.object({
  name: z.string(),
  role: roleSchema.optional(),
  regions: z.array(z.string()),
});

export type FiltersRequest = z.infer<typeof filtersRequestSchema>;

export const usersListResponseSchema = z.object({
  users: z.array(userSchema),
});

export type UsersListResponse = z.infer<typeof usersListResponseSchema>;
