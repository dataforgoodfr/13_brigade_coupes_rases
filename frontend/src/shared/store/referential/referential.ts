import { withId } from "@/shared/schema";
import { record, z } from "zod";

const variableRuleSchema = z.object({
	type: z.enum(["slope", "area"]),
	threshold: z.number(),
});
const ecologicalZoningRuleSchema = z.object({
	type: z.enum(["ecological_zoning"]),
	ecological_zonings_ids: z.string().array(),
});
const ruleResponseSchema = z.record(
	z.string(),
	variableRuleSchema.or(ecologicalZoningRuleSchema),
);

export type RuleResponse = z.infer<typeof ruleResponseSchema>;
export const ruleSchema = withId(ruleResponseSchema);
export type Rule = z.infer<typeof ruleSchema>;
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
	rules: ruleResponseSchema.optional(),
	departments: departmentResponseSchema.optional(),
	ecological_zonings: ecologicalZoningResponseSchema.optional(),
});

export type ReferentialResponse = z.infer<typeof referentialSchemaResponse>;
