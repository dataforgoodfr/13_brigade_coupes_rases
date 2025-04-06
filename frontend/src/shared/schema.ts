import { type ZodRecord, type ZodString, type ZodType, z } from "zod";

export function withId<T extends ZodType>(schema: ZodRecord<ZodString, T>) {
	return schema.valueSchema.and(z.object({ id: z.string() }));
}
