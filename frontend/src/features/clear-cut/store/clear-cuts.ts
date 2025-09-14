import { z } from "zod";
import { paginationResponseSchema } from "@/shared/api/types";
import {
	departmentSchema,
	ecologicalZoningSchema,
	ruleSchema,
} from "@/shared/store/referential/referential";

export const DISPLAY_PREVIEW_ZOOM_LEVEL = 13;

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
	observationStartDate: z.iso.date(),
	observationEndDate: z.iso.date(),
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
	email: z.email(),
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
	createdAt: z.iso.date(),
	updatedAt: z.iso.date(),
	totalAreaHectare: z.number(),
	totalBdfResinousAreaHectare: z.number().optional(),
	totalBdfDeciduousAreaHectare: z.number().optional(),
	totalBdfMixedAreaHectare: z.number().optional(),
	totalBdfPoplarAreaHectare: z.number().optional(),
	lastCutDate: z.iso.date(),
	satelliteImages: z.array(z.url()).optional(),
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
	inspectionDate: z.string().nullish().prefault(null),
	weather: z.string().nullish().prefault(null),
	forest: z.string().nullish().prefault(null),
	hasRemainingTrees: z.boolean().prefault(false),
	treesSpecies: z.string().nullish().prefault(null),
	plantingImages: z.array(z.string()).prefault([]),
	hasConstructionPanel: z.boolean().prefault(false),
	constructionPanelImages: z.array(z.string()).optional(),
	wetland: z.string().nullish().prefault(null),
	destructionClues: z.string().nullish().prefault(null),
	soilState: z.string().nullish().prefault(null),
	clearCutImages: z.array(z.string()).prefault([]),
	treeTrunksImages: z.array(z.string()).prefault([]),
	soilStateImages: z.array(z.string()).prefault([]),
	accessRoadImages: z.array(z.string()).prefault([]),
});

const clearCutFormEcologicalZoningSchema = z.object({
	hasOtherEcologicalZone: z.boolean().prefault(false),
	otherEcologicalZoneType: z.string().nullish().prefault(null),
	hasNearbyEcologicalZone: z.boolean().prefault(false),
	nearbyEcologicalZoneType: z.string().nullish().prefault(null),
	protectedSpecies: z.string().nullish().prefault(null),
	protectedHabitats: z.string().nullish().prefault(null),
	hasDdtRequest: z.boolean().prefault(false),
	ddtRequestOwner: z.string().nullish().prefault(null),
});

const clearCutFormActorsSchema = z.object({
	company: z.string().nullish().prefault(null),
	subcontractor: z.string().nullish().prefault(null),
	landlord: z.string().nullish().prefault(null),
});

const clearCutFormRegulationSchema = z.object({
	isPefcFscCertified: z.boolean().optional(),
	isOver20Ha: z.boolean().optional(),
	isPsgRequiredPlot: z.boolean().optional(),
});

const clearCutFormLegalStrategySchema = z.object({
	relevantForPefcComplaint: z.boolean().prefault(false),
	relevantForRediiiComplaint: z.boolean().prefault(false),
	relevantForOfbComplaint: z.boolean().prefault(false),
	relevantForAlertCnpfDdtSrgs: z.boolean().prefault(false),
	relevantForAlertCnpfDdtPsgThresholds: z.boolean().prefault(false),
	relevantForPsgRequest: z.boolean().prefault(false),
	requestEngaged: z.string().nullish().prefault(null),
});

const clearCutFormOtherSchema = z.object({
	other: z.string().optional(),
});

const existingClearCurFormSchema = z.object({
	id: z.string(),
	reportId: z.string(),
	createdAt: z.iso.datetime({ local: true }),
	etag: z.string(),
});
const clearCutFormSectionsResponseSchema = clearCutFormOtherSchema
	.and(clearCutFormGroundSchema)
	.and(clearCutFormEcologicalZoningSchema)
	.and(clearCutFormActorsSchema)
	.and(clearCutFormRegulationSchema)
	.and(clearCutFormLegalStrategySchema);

export const clearCutFormResponseSchema = existingClearCurFormSchema.and(
	clearCutFormSectionsResponseSchema,
);

export type ClearCutFormResponse = z.infer<typeof clearCutFormResponseSchema>;

export const clearCutFormSchema = clearCutFormSectionsResponseSchema.and(
	z
		.object({
			report: clearCutReportSchema,
			ecologicalZonings: ecologicalZoningSchema.array().prefault([]),
			hasEcologicalZonings: z.boolean().prefault(false),
		})
		.and(
			existingClearCurFormSchema
				.omit({ etag: true, id: true, createdAt: true })
				.and(
					z.object({
						etag: existingClearCurFormSchema.shape.etag.optional(),
						id: existingClearCurFormSchema.shape.id.optional(),
						createdAt: existingClearCurFormSchema.shape.createdAt.optional(),
					}),
				),
		),
);

export const clearCutFormVersionsSchema = z.object({
	latest: clearCutFormSchema.optional(),
	original: clearCutFormSchema,
	current: clearCutFormSchema,
	versionMismatchDisclaimerShown: z.boolean(),
});
export type ClearCutFormVersions = z.infer<typeof clearCutFormVersionsSchema>;
export type ClearCutForm = z.infer<typeof clearCutFormSchema>;
export type ClearCutFormInput = z.input<typeof clearCutFormSchema>;
export const clearCutFormsResponseSchema = paginationResponseSchema(
	clearCutFormResponseSchema,
);

export type ClearCutFormsResponse = z.infer<typeof clearCutFormsResponseSchema>;
