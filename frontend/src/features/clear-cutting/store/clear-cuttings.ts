import type { Status, Tag } from "@/shared/store/referential/referential";
import { z } from "zod";
import { pointTupleSchema } from "./types";

export const DISPLAY_PREVIEW_ZOOM_LEVEL = 10;

const clearCuttingPointsSchema = z.array(z.number());
export type ClearCuttingPoint = z.infer<typeof clearCuttingPointsSchema>;

const ecologicalZoningSchema = z.object({
	id: z.string(),
	name: z.string(),
	link: z.string().url(),
	logo: z.string().url(),
});

const clearCuttingBaseResponseSchema = z.object({
	id: z.string(),
	geoCoordinates: z.array(pointTupleSchema),
	name: z.string().optional(),
	center: pointTupleSchema,
	reportDate: z.string(),
	creationDate: z.string(),
	cutYear: z.number(),
	ecologicalZones: z.array(z.string()),
	abusiveTags: z.array(z.string()),
	naturaZone: z.string().optional(),
	comment: z.string().optional(),
	surfaceHectare: z.number(),
	slopePercent: z.number(),
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
		geoCoordinates: z.array(pointTupleSchema),
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
	clearCuttingsPoints: z.array(clearCuttingPointsSchema),
	clearCuttingPreviews: z.array(clearCuttingPreviewResponseSchema),
	waterCourses: z.array(waterCourseSchema),
	ecologicalZones: z.array(ecologicalZoningSchema),
});

export type ClearCuttingsResponse = z.infer<typeof clearCuttingsResponseSchema>;
export type ClearCuttings = Omit<
	ClearCuttingsResponse,
	"clearCuttingPreviews"
> & {
	clearCuttingPreviews: ClearCuttingPreview[];
};
