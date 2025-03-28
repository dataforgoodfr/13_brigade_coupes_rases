import type { Status, Tag } from "@/shared/store/referential/referential";
import { z } from "zod";
import { pointTupleSchema } from "./types";

export const DISPLAY_PREVIEW_ZOOM_LEVEL = 10;

const clearCuttingPointsSchema = z.array(z.number());
export type ClearCuttingPoint = z.infer<typeof clearCuttingPointsSchema>;

const ecological_zoningSchema = z.object({
	id: z.string(),
	name: z.string(),
	link: z.string().url(),
	logo: z.string().url(),
});

const clearCuttingBaseResponseSchema = z.object({
	id: z.string(),
	boundary: z.array(pointTupleSchema),
	name: z.string().optional(),
	location: pointTupleSchema,
	department_id: z.string(),
	cut_date: z.string().date(),
	ecologicalZones: z.array(z.string()).optional(),
	tags: z.array(z.string()),
	naturaZone: z.string().optional(),
	comment: z.string().optional(),
	area_hectare: z.number().optional(),
	slope_percentage: z.number().optional(),
	status: z.string(),
});
export type ClearCuttingBaseResponse = z.infer<
	typeof clearCuttingBaseResponseSchema
>;
type ClearCuttingBase = Omit<
	ClearCuttingBaseResponse,
	"abusiveTags" | "status"
> & {
	abusiveTags: Tag[];
	status: Status;
};

const clearCuttingPreviewResponseSchema = clearCuttingBaseResponseSchema.and(
	z.object({
		address: z.object({
			postalCode: z.string(),
			city: z.string(),
			country: z.string(),
		}),
		imagesCnt: z.number().optional(),
	}),
);

export type ClearCuttingPreviewResponse = z.infer<
	typeof clearCuttingPreviewResponseSchema
>;
export type ClearCuttingPreview = Omit<
	ClearCuttingPreviewResponse,
	"abusiveTags" | "status"
> &
	ClearCuttingBase;

const clearCuttingAddressSchema = z.object({
	streetName: z.string(),
	streetNumber: z.string(),
	postalCode: z.string(),
	city: z.string(),
	state: z.string().optional(),
	country: z.string(),
});
export type ClearCuttingAddress = z.infer<typeof clearCuttingAddressSchema>;
export const clearCuttingResponseSchema = clearCuttingBaseResponseSchema.and(
	z.object({
		id: z.string(),
		boundary: z.array(pointTupleSchema),
		waterCourses: z.array(z.string()).optional(),
		address: clearCuttingAddressSchema,
		customTags: z.array(z.string()).optional(),
		imageUrls: z.array(z.string().url()),
	}),
);

export type ClearCuttingResponse = z.infer<typeof clearCuttingResponseSchema>;
export type ClearCutting = Omit<
	ClearCuttingResponse,
	"abusiveTags" | "status"
> &
	ClearCuttingBase;

const waterCourseSchema = z.object({
	id: z.string(),
	geoCoordinates: z.array(pointTupleSchema),
});

export const clearCuttingsResponseSchema = z.object({
	points: z.array(clearCuttingPointsSchema),
	previews: z.array(clearCuttingPreviewResponseSchema),
	waterCourses: z.array(waterCourseSchema).optional(),
	ecologicalZones: z.array(ecological_zoningSchema).optional(),
});

export type ClearCuttingsResponse = z.infer<typeof clearCuttingsResponseSchema>;
export type ClearCuttings = Omit<
	ClearCuttingsResponse,
	"clearCuttingPreviews"
> & {
	clearCuttingPreviews: ClearCuttingPreview[];
};
