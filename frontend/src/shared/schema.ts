import { type ZodRecord, type ZodString, type ZodType, z } from "zod"

export function recordWithId<T extends ZodType>(
	schema: ZodRecord<ZodString, T>
) {
	return withId(schema.valueType)
}

export function withId<T extends ZodType>(schema: T) {
	return schema.and(z.object({ id: z.string() }))
}
