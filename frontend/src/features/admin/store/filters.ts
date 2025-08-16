import { z } from "zod";
import { userResponseSchema } from "@/features/admin/store/users";
import { roleSchema } from "@/features/user/store/user";
import { serverSideRequestSchema } from "@/shared/api/types";

const sortableKeysSchema = userResponseSchema
	.keyof()
	.exclude(["departments", "id"])
	.array();
export type SortableKeys = z.infer<typeof sortableKeysSchema>;
const filtersRequestSchema = serverSideRequestSchema(
	z.object({
		fullTextSearch: z.string().optional(),
		page: z.number(),
		size: z.number(),
		roles: z.array(roleSchema),
		email: z.string().optional(),
		firstName: z.string().optional(),
		lastName: z.string().optional(),
		departmentsIds: z.array(z.string()),
	}),
	sortableKeysSchema,
);

export type FiltersRequest = z.infer<typeof filtersRequestSchema>;
