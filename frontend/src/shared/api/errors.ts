import z from "zod";

export const createStringContentApiError = <T extends z.ZodLiteral>(
	type: T,
) => {
	return z.object({ detail: z.object({ type, content: z.string() }) });
};

export const etagMismatchErrorSchema = createStringContentApiError(
	z.literal("ETAG_MISMATCH"),
);
export type EtagMismatchError = z.infer<typeof etagMismatchErrorSchema>;
export const apiErrorSchema = etagMismatchErrorSchema;
