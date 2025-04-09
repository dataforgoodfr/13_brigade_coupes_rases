import { userSchema } from "@/features/user/store/user";
import {
	departmentSchema,
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
	department_id: z.string(),
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
	.omit({ tags_ids: true, clear_cuts: true, department_id: true })
	.and(
		z.object({
			department: departmentSchema,
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

const clearCutFormOnSiteResponseSchema = z.object({
	imgSatelliteCC: z.string().url().optional(),
	assignedUser: userSchema.nullable().default(null),
	onSiteDate: z.string().optional(),
	weather: z.string().optional(),
	// BCC : before clear-cutting
	standTypeAndSilviculturalSystemBCC: z.string().optional(),
	//ACC : after clear-cutting
	isPlantationPresentACC: z.boolean().default(false),
	newTreeSpicies: z.string().optional(),
	imgsPlantation: z.array(z.string().url()).default([]),
	isWorksiteSignPresent: z.boolean().default(false),
	imgWorksiteSign: z.string().url().optional(),
	waterCourseOrWetlandPresence: z.string().optional(),
	protectedSpeciesDestructionIndex: z.string().optional(),
	soilState: z.string().optional(),
	imgsClearCutting: z.array(z.string().url()).optional(),
	imgsTreeTrunks: z.array(z.string().url()).default([]),
	imgsSoilState: z.array(z.string().url()).default([]),
	imgsAccessRoad: z.array(z.string().url()).default([]),
});

const clearCutFormEcologicalZoningFormResponseSchema = z.object({
	isNatura2000: z.boolean().default(false),
	natura2000Zone: ecologicalZoningSchema.optional(),
	isOtherEcoZone: z.boolean().default(false),
	ecoZoneType: z.string().optional(),
	isNearEcoZone: z.boolean().default(false),
	nearEcoZoneType: z.string().optional(),
	protectedSpeciesOnZone: z.string().optional(),
	protectedSpeciesHabitatOnZone: z.string().optional(),
	isDDT: z.boolean().default(false),
	byWho: z.string().optional(),
});

const clearCutFormActorsFormResponseSchema = z.object({
	companyName: z.string().optional(),
	subcontractor: z.string().optional(),
	ownerName: z.string().optional(),
});

const clearCutFormRegulationsFormResponseSchema = z.object({
	isCCOrCompanyCertified: z.boolean().nullable().default(null),
	isMoreThan20ha: z.boolean().nullable().default(null),
	isSubjectToPSG: z.boolean().nullable().default(null),
});

const clearCutFormLegalStrategyFormResponseSchema = z.object({
	isRelevantComplaintPEFC: z.boolean().default(false),
	isRelevantComplaintREDIII: z.boolean().default(false),
	isRelevantComplaintOFB: z.boolean().default(false),
	isRelevantAlertSRGS: z.boolean().default(false),
	isRelevantAlertPSG: z.boolean().default(false),
	isRelevantRequestPSG: z.boolean().default(false),
	actionsUndertaken: z.string().optional(),
});

const clearCutFormOtherResponseSchema = z.object({
	imageUrls: z.array(z.string().url()).optional(),
	otherInfos: z.string().optional(),
});
const clearCutFormSectionsResponseSchema = clearCutFormOtherResponseSchema
	.and(clearCutFormOnSiteResponseSchema)
	.and(clearCutFormEcologicalZoningFormResponseSchema)
	.and(clearCutFormActorsFormResponseSchema)
	.and(clearCutFormRegulationsFormResponseSchema)
	.and(clearCutFormLegalStrategyFormResponseSchema);

export const clearCutFormResponseSchema = clearCutReportResponseSchema.and(
	clearCutFormSectionsResponseSchema,
);

export type ClearCutFormResponse = z.infer<typeof clearCutFormResponseSchema>;

export const clearCutFormSchema = clearCutReportSchema.and(
	clearCutFormSectionsResponseSchema,
);

export type ClearCutForm = z.infer<typeof clearCutFormSchema>;
