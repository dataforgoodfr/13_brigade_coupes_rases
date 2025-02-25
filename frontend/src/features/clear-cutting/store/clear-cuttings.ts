import { string, z } from "zod";
import { pointSchema } from "./types";

export const DISPLAY_PREVIEW_ZOOM_LEVEL = 10;

export const clearCuttingStatusSchema = z.enum([
	"toValidate",
	"validated",
	"rejected",
	"waitingInformation",
]);

export type ClearCuttingStatus = z.infer<typeof clearCuttingStatusSchema>;

const clearCuttingPointsSchema = z.array(z.number());
export type ClearCuttingPoint = z.infer<typeof clearCuttingPointsSchema>;

const ecologicalZoningSchema = z.object({
	id: z.string(),
	name: z.string(),
	link: z.string().url(),
	logo: z.string().url(),
});

const clearCuttingBaseSchema = z.object({
	id: z.string(),
	geoCoordinates: z.array(pointSchema),
	name: z.string().optional(),
	center: pointSchema,
	reportDate: z.string(),
	creationDate: z.string(),
	cutYear: z.number(),
	ecologicalZones: z.array(z.string()),
	abusiveTags: z.array(z.string()),
	cadastralParcel: z
		.object({
			id: string(),
			slope: z.number(),
			surfaceKm: z.number(),
		})
		.optional(),
	address: z.object({
		streetName: z.string(),
		streetNumber: z.string(),
		postalCode: z.string(),
		city: z.string(),
		state: z.string().optional(),
		country: z.string(),
	}),
	status: clearCuttingStatusSchema,
});

const clearCuttingPreviewSchema = clearCuttingBaseSchema.and(
	z.object({
		imageUrl: z.string().url().optional(),
		imagesCnt: z.number().optional(),
	}),
);

export type ClearCuttingPreview = z.infer<typeof clearCuttingPreviewSchema>;

export const clearCuttingSchema = clearCuttingBaseSchema.and(
	z.object({
		id: z.string(),
		geoCoordinates: z.array(pointSchema),
		waterCourses: z.array(z.string()).optional(),
		
		customTags: z.array(z.string()).optional(),
		imageUrls: z.array(z.string().url()),
	}),
);

export type ClearCutting = z.infer<typeof clearCuttingSchema>;

const waterCourseSchema = z.object({
	id: z.string(),
	geoCoordinates: z.array(pointSchema),
});

export const clearCuttingsResponseSchema = z.object({
	clearCuttingsPoints: z.array(clearCuttingPointsSchema),
	clearCuttingPreviews: z.array(clearCuttingPreviewSchema),
	waterCourses: z.array(waterCourseSchema),
	ecologicalZones: z.array(ecologicalZoningSchema),
});

export type ClearCuttingsResponse = z.infer<typeof clearCuttingsResponseSchema>;

export function getAreaColor(status: ClearCuttingStatus) {
	switch (status) {
		case "toValidate":
			return "#FCAD02";
		case "rejected":
			return "#FF3300";
		case "validated":
			return "#204933";
		case "waitingInformation":
			return "#FCAD02";
	}
}
