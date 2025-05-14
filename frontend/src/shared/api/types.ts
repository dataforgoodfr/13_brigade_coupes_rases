import { z } from "zod";

export const requestStatusSchema = z.enum([
	"idle",
	"loading",
	"error",
	"success",
]);
export const errorContentSchema = <TError extends z.ZodType>(
	errorSchema: TError,
) =>
	z.object({
		status: requestStatusSchema.extract(["error"]),
		error: errorSchema,
	});

export type ErrorContent<TError> = z.infer<
	ReturnType<typeof errorContentSchema<z.ZodType<TError>>>
>;

export const successContentSchema = <TValue extends z.ZodType>(
	valueSchema: TValue,
) =>
	z.object({
		status: requestStatusSchema.extract(["success"]),
		value: valueSchema,
	});
export type SuccessContent<TValue> = z.infer<
	ReturnType<typeof successContentSchema<z.ZodType<TValue>>>
>;

export const idleContentSchema = z.object({
	status: requestStatusSchema.extract(["idle"]),
});
export type IdleContent = z.infer<typeof idleContentSchema>;

export const loadingContentSchema = z.object({
	status: requestStatusSchema.extract(["loading"]),
});
export type LoadingContent = z.infer<typeof loadingContentSchema>;

export type RequestedContent<TValue, TError = unknown> = {
	status: z.infer<typeof requestStatusSchema>;
	error?: TError;
	value?: TValue;
};

export type RequiredRequestedContent<TValue, TError = unknown> = Omit<
	RequestedContent<TValue, TError>,
	"value"
> & { value: TValue };

const hateaosMetadataSchema = z.object({
	links: z.record(z.string(), z.string()),
});
export const hateaosResponseSchema = <TValue extends z.ZodType>(
	valueSchema: TValue,
) =>
	z.object({
		content: valueSchema,
		metadata: hateaosMetadataSchema,
	});

export const paginationResponseSchema = <TValue extends z.ZodType>(
	valueSchema: TValue,
) =>
	hateaosResponseSchema(valueSchema.array()).and(
		z.object({
			metadata: hateaosMetadataSchema.and(
				z.object({
					pages_count: z.number(),
					total_count: z.number(),
					page: z.number(),
					size: z.number(),
				}),
			),
		}),
	);
