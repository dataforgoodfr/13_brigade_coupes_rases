import {
	ecologicalZoningRuleResponseSchema,
	variableRuleResponseSchema,
} from "@/shared/store/referential/referential";
import { z } from "zod";

export const ecologicalZoningRuleResponseSchemaWithId =
	ecologicalZoningRuleResponseSchema.and(z.object({ id: z.string() }));
export const variableRuleResponseSchemaWithId = variableRuleResponseSchema.and(
	z.object({ id: z.string() }),
);
export const ruleResponseSchema = variableRuleResponseSchemaWithId.or(
	ecologicalZoningRuleResponseSchemaWithId,
);

export const rulesResponseSchema = z.array(ruleResponseSchema);

export type RuleResponse = z.infer<typeof ruleResponseSchema>;
export type RulesResponse = z.infer<typeof rulesResponseSchema>;
export type EcologicalZoningRuleResponse = z.infer<
	typeof ecologicalZoningRuleResponseSchemaWithId
>;
export type VariableRuleResponse = z.infer<
	typeof variableRuleResponseSchemaWithId
>;
