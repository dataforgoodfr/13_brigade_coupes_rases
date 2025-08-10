import { z } from "zod";
import { paginationResponseSchema } from "@/shared/api/types";
import {
	departmentSchema,
	ecologicalZoningSchema,
	ruleSchema,
} from "@/shared/store/referential/referential";

export const DISPLAY_PREVIEW_ZOOM_LEVEL = 10;

export const CLEAR_CUTTING_STATUSES = [
	"to_validate",
	"waiting_for_validation",
	"validated",
	"legal_validated",
	"final_validated",
] as const;

export const clearCutStatusSchema = z.enum(CLEAR_CUTTING_STATUSES);

export type ClearCutStatus = z.infer<typeof clearCutStatusSchema>;

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
	observationStartDate: z.string().date(),
	observationEndDate: z.string().date(),
	ecologicalZoningIds: z.string().array(),
	areaHectare: z.number(),
});
export type ClearCutResponse = z.infer<typeof clearCutResponseSchema>;
const clearCutSchema = clearCutResponseSchema
	.omit({
		ecologicalZoningIds: true,
	})
	.and(
		z.object({
			ecologicalZonings: ecologicalZoningSchema.array(),
		}),
	);
export type ClearCut = z.infer<typeof clearCutSchema>;

export const publicUserSchema = z.object({
	login: z.string(),
	email: z.string().email(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;
export const clearCutReportResponseSchema = z.object({
	id: z.string(),
	clearCuts: z.array(clearCutResponseSchema),
	city: z.string(),
	comment: z.string().optional(),
	name: z.string().optional(),
	status: clearCutStatusSchema,
	averageLocation: pointSchema,
	slopeAreaHectare: z.number().optional(),
	departmentId: z.string(),
	createdAt: z.string().date(),
	updatedAt: z.string().date(),
	totalAreaHectare: z.number(),
	totalBdfResinousAreaHectare: z.number().optional(),
	totalBdfDeciduousAreaHectare: z.number().optional(),
	totalBdfMixedAreaHectare: z.number().optional(),
	totalBdfPoplarAreaHectare: z.number().optional(),
	lastCutDate: z.string().date(),
	satelliteImages: z.array(z.string().url()).optional(),
	rulesIds: z.array(z.string()),
	affectedUser: publicUserSchema.optional(),
});
export type ClearCutReportResponse = z.infer<
	typeof clearCutReportResponseSchema
>;

export const clearCutReportSchema = clearCutReportResponseSchema
	.omit({ rulesIds: true, clearCuts: true, departmentId: true })
	.and(
		z.object({
			department: departmentSchema,
			rules: ruleSchema.array(),
			clearCuts: z.array(clearCutSchema),
		}),
	);

export type ClearCutReport = z.infer<typeof clearCutReportSchema>;

const countedPoint = z.object({
	count: z.number(),
	point: pointSchema,
});
const clusterizedPointsSchema = z.object({
	total: z.number(),
	content: countedPoint.array(),
});
export const clearCutsResponseSchema = z.object({
	points: clusterizedPointsSchema,
	previews: z.array(clearCutReportResponseSchema),
});

export type ClearCutsResponse = z.infer<typeof clearCutsResponseSchema>;

const clearCutsSchema = clearCutsResponseSchema.omit({ previews: true }).and(
	z.object({
		previews: z.array(clearCutReportSchema),
	}),
);
export type ClearCuts = z.infer<typeof clearCutsSchema>;

const clearCutFormGroundSchema = z.object({
	inspectionDate: z.string().optional(),
	weather: z.string().optional(),
	forest: z.string().optional(),
	hasRemainingTrees: z.boolean().default(false),
	treesSpecies: z.string().optional(),
	plantingImages: z.array(z.string()).default([]),
	hasConstructionPanel: z.boolean().default(false),
	constructionPanelImages: z.array(z.string()).optional(),
	wetland: z.string().optional(),
	destructionClues: z.string().optional(),
	soilState: z.string().optional(),
	clearCutImages: z.array(z.string()).default([]),
	treeTrunksImages: z.array(z.string()).default([]),
	soilStateImages: z.array(z.string()).default([]),
	accessRoadImages: z.array(z.string()).default([]),
});

const clearCutFormEcologicalZoningSchema = z.object({
	hasOtherEcologicalZone: z.boolean().default(false),
	otherEcologicalZoneType: z.string().optional(),
	hasNearbyEcologicalZone: z.boolean().default(false),
	nearbyEcologicalZoneType: z.string().optional(),
	protectedSpecies: z.string().optional(),
	protectedHabitats: z.string().optional(),
	hasDdtRequest: z.boolean().default(false),
	ddtRequestOwner: z.string().optional(),
});

const clearCutFormActorsSchema = z.object({
	company: z.string().optional(),
	subcontractor: z.string().optional(),
	landlord: z.string().optional(),
});

const clearCutFormRegulationSchema = z.object({
	isPefcFscCertified: z.boolean().optional(),
	isOver20Ha: z.boolean().optional(),
	isPsgRequiredPlot: z.boolean().optional(),
});

const clearCutFormLegalStrategySchema = z.object({
	relevantForPefcComplaint: z.boolean().default(false),
	relevantForRediiiComplaint: z.boolean().default(false),
	relevantForOfbComplaint: z.boolean().default(false),
	relevantForAlertCnpfDdtSrgs: z.boolean().default(false),
	relevantForAlertCnpfDdtPsgThresholds: z.boolean().default(false),
	relevantForPsgRequest: z.boolean().default(false),
	requestEngaged: z.string().optional(),
});

const clearCutFormOtherSchema = z.object({
	other: z.string().optional(),
});

const existingClearCurFormSchema = z.object({
	id: z.string(),
	reportId: z.string(),
	createdAt: z.string().date(),
});
const clearCutFormSectionsResponseSchema = clearCutFormOtherSchema
	.and(clearCutFormGroundSchema)
	.and(clearCutFormEcologicalZoningSchema)
	.and(clearCutFormActorsSchema)
	.and(clearCutFormRegulationSchema)
	.and(clearCutFormLegalStrategySchema);

const clearCutFormResponseSchema = existingClearCurFormSchema.and(
	clearCutFormSectionsResponseSchema,
);

export type ClearCutFormResponse = z.infer<typeof clearCutFormResponseSchema>;

export const clearCutFormSchema = clearCutFormSectionsResponseSchema.and(
	z.object({
		report: clearCutReportSchema,
		ecologicalZonings: ecologicalZoningSchema.array().default([]),
		hasEcologicalZonings: z.boolean().default(false),
	}),
);

export type ClearCutForm = z.infer<typeof clearCutFormSchema>;
export type ClearCutFormInput = z.input<typeof clearCutFormSchema>;
export const clearCutFormsResponseSchema = paginationResponseSchema(
	clearCutFormResponseSchema,
);

export type ClearCutFormsResponse = z.infer<typeof clearCutFormsResponseSchema>;
