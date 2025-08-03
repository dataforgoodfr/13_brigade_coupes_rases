import { z } from "zod";
import { userResponseSchema } from "@/features/admin/store/users";
import { roleSchema } from "@/features/user/store/user";
import { sortSchema } from "@/shared/api/api";

const sortableKeysSchema = userResponseSchema
	.keyof()
	.exclude(["departments", "id"])
	.array();

export type SortableKeys = z.infer<typeof sortableKeysSchema>;
const filtersRequestSchema = z.object({
	name: z.string().optional(),
	page: z.number(),
	size: z.number(),
	roles: z.array(roleSchema),
	departmentsIds: z.array(z.string()),
	[`${sortSchema.extract(["asc"])}Sort`]: sortableKeysSchema,
	[`${sortSchema.extract(["desc"])}Sort`]: sortableKeysSchema,
});

export type FiltersRequest = z.infer<typeof filtersRequestSchema>;
