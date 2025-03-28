import type { ItemFromRecord } from "@/shared/array";
import { record, z } from "zod";

export const CLEAR_CUTTING_STATUSES = [
	"to_validate",
	"waiting_for_validation",
	"validated",
	"legal_validated",
	"final_validated",
] as const;

export const clearCuttingStatusSchema = z.enum(CLEAR_CUTTING_STATUSES);
export type ClearCuttingStatus = z.infer<typeof clearCuttingStatusSchema>;

const variableRuleTagSchema = z.object({
	type: z.enum(["excessive_slop", "excessive_area"]),
	value: z.number(),
});
const staticTagSchema = z.object({
	type: z.enum(["ecological_zoning"]),
});
const abusiveTagSchema = z.record(
	z.string(),
	variableRuleTagSchema.or(staticTagSchema),
);

export type TagResponse = z.infer<typeof abusiveTagSchema>;
export type Tag = ItemFromRecord<TagResponse>;
export const departmentResponseSchema = record(
	z.string(),
	z.object({ name: z.string() }),
);
export const departmentSchema = z.object({
	id: z.string(),
	name: z.string(),
});
export type DepartmentResponse = z.infer<typeof departmentResponseSchema>;
export type Department = z.infer<typeof departmentSchema>;
const ecological_zoningResponseSchema = z.record(
	z.string(),
	z.object({ name: z.string() }),
);
export type ecological_zoningResponse = z.infer<
	typeof ecological_zoningResponseSchema
>;
export const ecological_zoningSchema = z.object({
	id: z.string(),
	name: z.string(),
});
export type ecological_zoning = z.infer<typeof ecological_zoningSchema>;

const statusesResponseSchema = z.record(
	z.string(),
	z.object({ name: clearCuttingStatusSchema }),
);
export type StatusResponse = z.infer<typeof statusesResponseSchema>;
export const statusSchema = z.object({
	id: z.string(),
	name: clearCuttingStatusSchema,
});

export type Status = z.infer<typeof statusSchema>;

export const referentialSchemaResponse = z.object({
	tags: abusiveTagSchema.optional(),
	departments: departmentResponseSchema.optional(),
	ecological_zoning: ecological_zoningResponseSchema.optional(),
	statuses: statusesResponseSchema.optional(),
});

export type ReferentialResponse = z.infer<typeof referentialSchemaResponse>;
