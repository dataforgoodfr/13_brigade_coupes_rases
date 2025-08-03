import { recordWithId } from "@/shared/schema";
import { record, z } from "zod";

export const variableRulesTypeSchema = z.enum(["slope", "area"]);
export type VariableRulesType = z.infer<typeof variableRulesTypeSchema>;
export const ecologicalZoningRuleTypeSchema = z.enum(["ecological_zoning"]);
export type EcologicalZoningRuleType = z.infer<
	typeof ecologicalZoningRuleTypeSchema
>;
export type EcologicalZoningType = z.infer<
	typeof ecologicalZoningRuleTypeSchema
>;
export type RuleType = VariableRulesType | EcologicalZoningRuleType;
export const variableRuleResponseSchema = z.object({
	type: variableRulesTypeSchema,
	threshold: z.number(),
});
export const ecologicalZoningRuleResponseSchema = z.object({
	type: ecologicalZoningRuleTypeSchema,
	ecologicalZoningsIds: z.string().array(),
});
const ruleResponseSchema = z.record(
	z.string(),
	variableRuleResponseSchema.or(ecologicalZoningRuleResponseSchema),
);

export type RuleResponse = z.infer<typeof ruleResponseSchema>;
export const ruleSchema = recordWithId(ruleResponseSchema);
export type Rule = z.infer<typeof ruleSchema>;
export const departmentResponseSchema = record(
	z.string(),
	z.object({ name: z.string() }),
);

export type DepartmentResponse = z.infer<typeof departmentResponseSchema>;
export const departmentSchema = recordWithId(departmentResponseSchema);
export type Department = z.infer<typeof departmentSchema>;

const ecologicalZoningResponseSchema = z.record(
	z.string(),
	z.object({
		name: z.string(),
		code: z.string(),
		type: z.string(),
		subType: z.string().optional(),
	}),
);
export type EcologicalZoningResponse = z.infer<
	typeof ecologicalZoningResponseSchema
>;
export const ecologicalZoningSchema = recordWithId(
	ecologicalZoningResponseSchema,
);
export type EcologicalZoning = z.infer<typeof ecologicalZoningSchema>;

export const referentialSchemaResponse = z.object({
	rules: ruleResponseSchema.optional(),
	departments: departmentResponseSchema.optional(),
	ecologicalZonings: ecologicalZoningResponseSchema.optional(),
});

export type ReferentialResponse = z.infer<typeof referentialSchemaResponse>;
