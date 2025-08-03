import { z } from "zod";
import { withId } from "@/shared/schema";
import {
	ecologicalZoningRuleResponseSchema,
	variableRuleResponseSchema,
} from "@/shared/store/referential/referential";

export const ecologicalZoningRuleResponseSchemaWithId = withId(
	ecologicalZoningRuleResponseSchema,
);
export const variableRuleResponseSchemaWithId = withId(
	variableRuleResponseSchema,
);
export const ruleResponseSchema = variableRuleResponseSchemaWithId.or(
	ecologicalZoningRuleResponseSchemaWithId,
);
const ruleRequestSchema = withId(
	ecologicalZoningRuleResponseSchema
		.omit({ type: true })
		.or(variableRuleResponseSchema.omit({ type: true })),
);

export const updateRulesRequestSchema = z.object({
	rules: ruleRequestSchema.array(),
});
export type UpdateRulesRequest = z.infer<typeof updateRulesRequestSchema>;

export const rulesResponseSchema = z.array(ruleResponseSchema);

export type RuleResponse = z.infer<typeof ruleResponseSchema>;
export type RulesResponse = z.infer<typeof rulesResponseSchema>;
export type EcologicalZoningRuleResponse = z.infer<
	typeof ecologicalZoningRuleResponseSchemaWithId
>;
export type VariableRuleResponse = z.infer<
	typeof variableRuleResponseSchemaWithId
>;
