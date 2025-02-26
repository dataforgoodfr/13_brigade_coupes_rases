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
	naturaZone: z.string().optional(),
	cadastralParcel: z
		.object({
			id: string(),
			slope: z.number(),
			surfaceKm: z.number(),
		})
		.optional(),

	status: clearCuttingStatusSchema,
});

const clearCuttingPreviewSchema = clearCuttingBaseSchema.and(
	z.object({
		address: z.object({
			postalCode: z.string(),
			city: z.string(),
			country: z.string(),
		}),
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
		address: z.object({
			streetName: z.string(),
			streetNumber: z.string(),
			postalCode: z.string(),
			city: z.string(),
			state: z.string().optional(),
			country: z.string(),
		}),
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

export const CLEAR_CUTTING_STATUS_COLORS: Record<ClearCuttingStatus, string>  = {
	"toValidate": "#FCAD02",
	"rejected": "#FF3300",
	"validated": "#204933",
	"waitingInformation": "#FCAD02",
};

export function getClearCuttingStatusColor(status: ClearCuttingStatus) {
	return CLEAR_CUTTING_STATUS_COLORS[status];
}
