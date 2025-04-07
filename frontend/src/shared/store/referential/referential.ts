import { withId } from "@/shared/schema";
import { record, z } from "zod";

const variableRuleTagSchema = z.object({
	type: z.enum(["excessive_slop", "excessive_area"]),
	value: z.number(),
});
const staticTagSchema = z.object({
	type: z.enum(["ecological_zoning"]),
});
const tagResponseSchema = z.record(
	z.string(),
	variableRuleTagSchema.or(staticTagSchema),
);

export type TagResponse = z.infer<typeof tagResponseSchema>;
export const tagSchema = withId(tagResponseSchema);
export type Tag = z.infer<typeof tagSchema>;
export const departmentResponseSchema = record(
	z.string(),
	z.object({ name: z.string() }),
);

export type DepartmentResponse = z.infer<typeof departmentResponseSchema>;
export const departmentSchema = withId(departmentResponseSchema);
export type Department = z.infer<typeof departmentSchema>;

const ecologicalZoningResponseSchema = z.record(
	z.string(),
	z.object({
		name: z.string(),
		code: z.string(),
		type: z.string(),
		sub_type: z.string().nullable(),
	}),
);
export type EcologicalZoningResponse = z.infer<
	typeof ecologicalZoningResponseSchema
>;
export const ecologicalZoningSchema = withId(ecologicalZoningResponseSchema);
export type EcologicalZoning = z.infer<typeof ecologicalZoningSchema>;

export const referentialSchemaResponse = z.object({
	tags: tagResponseSchema.optional(),
	departments: departmentResponseSchema.optional(),
	ecological_zonings: ecologicalZoningResponseSchema.optional(),
});

export type ReferentialResponse = z.infer<typeof referentialSchemaResponse>;
