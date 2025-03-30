import {
	ecologicalZoningSchema,
	tagSchema,
} from "@/shared/store/referential/referential";
import { z } from "zod";

export const DISPLAY_PREVIEW_ZOOM_LEVEL = 10;

export const CLEAR_CUTTING_STATUSES = [
	"to_validate",
	"waiting_for_validation",
	"validated",
	"legal_validated",
	"final_validated",
] as const;

export const clearCuttingStatusSchema = z.enum(CLEAR_CUTTING_STATUSES);

export type ClearCuttingStatus = z.infer<typeof clearCuttingStatusSchema>;

const geoJsonTypeSchema = z.enum(["Point", "MultiPolygon"]);
const pointSchema = z.object({
	type: geoJsonTypeSchema.extract(["Point"]),
	coordinates: z.tuple([z.number(), z.number()]),
});
const multiPolygonSchema = z.object({
	type: geoJsonTypeSchema.extract(["MultiPolygon"]),
	coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
});
export type Point = z.infer<typeof pointSchema>;
export type MultiPolygon = z.infer<typeof multiPolygonSchema>;

export const clearCuttingBaseResponseSchema = z.object({
	id: z.string(),
	boundary: multiPolygonSchema,
	name: z.string().optional(),
	location: pointSchema,
	cities: z.array(z.string()),
	cut_date: z.string().date(),
	created_at: z.string().datetime({ local: true }),
	tags_ids: z.array(z.string()),
	ecological_zoning_ids: z.string().array(),
	comment: z.string().optional(),
	area_hectare: z.number(),
	slope_percentage: z.number(),
	status: clearCuttingStatusSchema,
});
export type ClearCuttingBaseResponse = z.infer<
	typeof clearCuttingBaseResponseSchema
>;
export type ClearCuttingPreviewResponse = ClearCuttingBaseResponse;
const clearCuttingBaseSchema = clearCuttingBaseResponseSchema
	.omit({
		ecological_zoning_ids: true,
		tags_ids: true,
	})
	.and(
		z.object({
			ecologicalZonings: ecologicalZoningSchema.array(),
			tags: tagSchema.array(),
		}),
	);
export type ClearCuttingPreview = z.infer<typeof clearCuttingBaseSchema>;
export type ClearCutting = ClearCuttingPreview;

export const clearCuttingsResponseSchema = z.object({
	points: z.array(pointSchema),
	previews: z.array(clearCuttingBaseResponseSchema),
});

export type ClearCuttingsResponse = z.infer<typeof clearCuttingsResponseSchema>;
const clearCuttingsSchema = clearCuttingsResponseSchema
	.omit({ previews: true })
	.and(
		z.object({
			previews: z.array(clearCuttingBaseSchema),
		}),
	);
export type ClearCuttings = z.infer<typeof clearCuttingsSchema>;
