import z from "zod"

export const toApiErrorSchema = <
	Type extends z.ZodLiteral,
	Content extends z.ZodType = z.ZodString
>(
	type: Type,
	content: Content
) => z.object({ detail: z.object({ type, content: content }) })
export const toStringApiErrorSchema = <Type extends z.ZodLiteral>(type: Type) =>
	toApiErrorSchema(type, z.string())

export const createStringContentApiError = <T extends z.ZodLiteral>(
	type: T
) => {
	return z.object({ detail: z.object({ type, content: z.string() }) })
}

export const etagMismatchErrorSchema = createStringContentApiError(
	z.literal("ETAG_MISMATCH")
)
export type EtagMismatchError = z.infer<typeof etagMismatchErrorSchema>
export const apiErrorSchema = etagMismatchErrorSchema
