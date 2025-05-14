import { roleSchema } from "@/features/user/store/user";
import { z } from "zod";

const filtersRequestSchema = z.object({
	name: z.string().optional(),
	page: z.number(),
	size: z.number(),
	roles: z.array(roleSchema),
	departments_ids: z.array(z.string()),
});

export type FiltersRequest = z.infer<typeof filtersRequestSchema>;
