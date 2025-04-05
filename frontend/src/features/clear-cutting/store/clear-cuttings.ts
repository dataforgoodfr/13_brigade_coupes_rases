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

export const clearCutResponseSchema = z.object({
	id: z.string(),
	boundary: multiPolygonSchema,
	location: pointSchema,
	observation_start_date: z.string().date(),
	observation_end_date: z.string().date(),
	ecological_zoning_ids: z.string().array(),
	area_hectare: z.number(),
});
export type ClearCutResponse = z.infer<typeof clearCutResponseSchema>;
const clearCutSchema = clearCutResponseSchema
	.omit({
		ecological_zoning_ids: true,
	})
	.and(
		z.object({
			ecologicalZonings: ecologicalZoningSchema.array(),
		}),
	);
export type ClearCut = z.infer<typeof clearCutSchema>;

export const clearCutReportResponseSchema = z.object({
	id: z.string(),
	clear_cuts: z.array(clearCutResponseSchema),
	city: z.string(),
	comment: z.string().optional(),
	name: z.string().optional(),
	status: clearCuttingStatusSchema,
	average_location: pointSchema,
	slope_area_ratio_percentage: z.number(),
	created_at: z.string().date(),
	updated_at: z.string().date(),
	total_area_hectare: z.number(),
	last_cut_date: z.string().date(),
	tags_ids: z.array(z.string()),
});
export type ClearCutReportResponse = z.infer<
	typeof clearCutReportResponseSchema
>;

export const clearCutReportSchema = clearCutReportResponseSchema
	.omit({ tags_ids: true, clear_cuts: true })
	.and(
		z.object({
			tags: tagSchema.array(),
			clear_cuts: z.array(clearCutSchema),
		}),
	);

export type ClearCutReport = z.infer<typeof clearCutReportSchema>;

export const clearCuttingsResponseSchema = z.object({
	points: z.array(pointSchema),
	previews: z.array(clearCutReportResponseSchema),
});

export type ClearCuttingsResponse = z.infer<typeof clearCuttingsResponseSchema>;
const clearCuttingsSchema = clearCuttingsResponseSchema
	.omit({ previews: true })
	.and(
		z.object({
			previews: z.array(clearCutReportSchema),
		}),
	);
export type ClearCuttings = z.infer<typeof clearCuttingsSchema>;
