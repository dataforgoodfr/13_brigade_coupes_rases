import { z } from "zod"

import { paginationResponseSchema } from "@/shared/api/types"
import {
	departmentSchema,
	ecologicalZoningSchema,
	ruleSchema
} from "@/shared/store/referential/referential"

export const DISPLAY_PREVIEW_ZOOM_LEVEL = 13

export const CLEAR_CUTTING_STATUSES = [
	"to_validate",
	"waiting_for_validation",
	"validated",
	"legal_validated",
	"final_validated"
] as const

export const clearCutStatusSchema = z.enum(CLEAR_CUTTING_STATUSES)

export type ClearCutStatus = z.infer<typeof clearCutStatusSchema>

const geoJsonTypeSchema = z.enum(["Point", "MultiPolygon"])
const pointSchema = z.object({
	type: geoJsonTypeSchema.extract(["Point"]),
	coordinates: z.tuple([z.number(), z.number()])
})
const multiPolygonSchema = z.object({
	type: geoJsonTypeSchema.extract(["MultiPolygon"]),
	coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()]))))
})

export type Point = z.infer<typeof pointSchema>
export type MultiPolygon = z.infer<typeof multiPolygonSchema>

export const clearCutResponseSchema = z.object({
	id: z.string(),
	boundary: multiPolygonSchema,
	location: pointSchema,
	observationStartDate: z.iso.date(),
	observationEndDate: z.iso.date(),
	ecologicalZoningIds: z.string().array(),
	areaHectare: z.number()
})
export type ClearCutResponse = z.infer<typeof clearCutResponseSchema>
const clearCutSchema = clearCutResponseSchema
	.omit({
		ecologicalZoningIds: true
	})
	.extend(
		z.object({
			ecologicalZonings: ecologicalZoningSchema.array()
		}).shape
	)
export type ClearCut = z.infer<typeof clearCutSchema>

export const publicUserSchema = z.object({
	login: z.string(),
	email: z.email()
})
export type PublicUser = z.infer<typeof publicUserSchema>
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
	firstCutDate: z.iso.date(),
	satelliteImages: z.array(z.url()).optional(),
	rulesIds: z.array(z.string()),
	affectedUser: publicUserSchema.optional()
})
export type ClearCutReportResponse = z.infer<
	typeof clearCutReportResponseSchema
>

export const clearCutReportSchema = clearCutReportResponseSchema
	.omit({ rulesIds: true, clearCuts: true, departmentId: true })
	.extend(
		z.object({
			department: departmentSchema,
			rules: ruleSchema.array(),
			clearCuts: z.array(clearCutSchema)
		}).shape
	)

export type ClearCutReport = z.infer<typeof clearCutReportSchema>

const countedPoint = z.object({
	count: z.number(),
	point: pointSchema
})
const clusterizedPointsSchema = z.object({
	total: z.number(),
	content: countedPoint.array()
})
export const clearCutsResponseSchema = z.object({
	points: clusterizedPointsSchema,
	previews: z.array(clearCutReportResponseSchema)
})

export type ClearCutsResponse = z.infer<typeof clearCutsResponseSchema>

const clearCutsSchema = clearCutsResponseSchema.omit({ previews: true }).extend(
	z.object({
		previews: z.array(clearCutReportSchema)
	}).shape
)
export type ClearCuts = z.infer<typeof clearCutsSchema>

const clearCutFormGroundSchema = z.object({
	inspectionDate: z.iso.datetime({ local: true }).optional(),
	weather: z.string().optional().prefault(""),
	forest: z.string().optional().prefault(""),
	hasRemainingTrees: z.boolean().prefault(false),
	treesSpecies: z.string().optional().prefault(""),
	plantingImages: z.array(z.string()).prefault([]),
	hasConstructionPanel: z.boolean().prefault(false),
	constructionPanelImages: z.array(z.string()).optional(),
	wetland: z.string().optional().prefault(""),
	destructionClues: z.string().optional().prefault(""),
	soilState: z.string().optional().prefault(""),
	clearCutImages: z.array(z.string()).prefault([]),
	treeTrunksImages: z.array(z.string()).prefault([]),
	soilStateImages: z.array(z.string()).prefault([]),
	accessRoadImages: z.array(z.string()).prefault([])
})

const clearCutFormEcologicalZoningSchema = z.object({
	hasOtherEcologicalZone: z.boolean().prefault(false),
	otherEcologicalZoneType: z.string().optional().prefault(""),
	hasNearbyEcologicalZone: z.boolean().prefault(false),
	nearbyEcologicalZoneType: z.string().optional().prefault(""),
	protectedSpecies: z.string().optional().prefault(""),
	protectedHabitats: z.string().optional().prefault(""),
	hasDdtRequest: z.boolean().prefault(false),
	ddtRequestOwner: z.string().optional().prefault("")
})

const clearCutFormActorsSchema = z.object({
	company: z.string().optional().prefault(""),
	subcontractor: z.string().optional().prefault(""),
	landlord: z.string().optional().prefault("")
})

const clearCutFormRegulationSchema = z.object({
	isPefcFscCertified: z.boolean().optional(),
	isOver20Ha: z.boolean().optional(),
	isPsgRequiredPlot: z.boolean().optional()
})

const clearCutFormLegalStrategySchema = z.object({
	relevantForPefcComplaint: z.boolean().prefault(false),
	relevantForRediiiComplaint: z.boolean().prefault(false),
	relevantForOfbComplaint: z.boolean().prefault(false),
	relevantForAlertCnpfDdtSrgs: z.boolean().prefault(false),
	relevantForAlertCnpfDdtPsgThresholds: z.boolean().prefault(false),
	relevantForPsgRequest: z.boolean().prefault(false),
	requestEngaged: z.string().optional().prefault("")
})

const clearCutFormOtherSchema = z.object({
	other: z.string().optional()
})

const existingClearCutFormSchema = z.object({
	id: z.string(),
	reportId: z.string(),
	createdAt: z.iso.datetime({ local: true }),
	etag: z.string()
})
const clearCutFormSectionsResponseSchema = clearCutFormOtherSchema
	.extend(clearCutFormGroundSchema.shape)
	.extend(clearCutFormEcologicalZoningSchema.shape)
	.extend(clearCutFormActorsSchema.shape)
	.extend(clearCutFormRegulationSchema.shape)
	.extend(clearCutFormLegalStrategySchema.shape)

export const clearCutFormResponseSchema = existingClearCutFormSchema.extend(
	clearCutFormSectionsResponseSchema.shape
)

export type ClearCutFormResponse = z.infer<typeof clearCutFormResponseSchema>

export const clearCutFormSchema = clearCutFormSectionsResponseSchema.extend(
	z
		.object({
			report: clearCutReportSchema,
			ecologicalZonings: ecologicalZoningSchema.array().prefault([]),
			hasEcologicalZonings: z.boolean().prefault(false)
		})
		.extend(
			existingClearCutFormSchema
				.omit({ etag: true, id: true, createdAt: true })
				.extend(
					z.object({
						etag: existingClearCutFormSchema.shape.etag.optional(),
						id: existingClearCutFormSchema.shape.id.optional(),
						createdAt: existingClearCutFormSchema.shape.createdAt.optional()
					}).shape
				).shape
		).shape
)

export const clearCutFormVersionsSchema = z.object({
	latest: clearCutFormSchema.optional(),
	original: clearCutFormSchema,
	current: clearCutFormSchema,
	versionMismatchDisclaimerShown: z.boolean()
})
export type ClearCutFormVersions = z.infer<typeof clearCutFormVersionsSchema>
export type ClearCutForm = z.infer<typeof clearCutFormSchema>
export type ClearCutFormInput = z.input<typeof clearCutFormSchema>
export const clearCutFormsResponseSchema = paginationResponseSchema(
	clearCutFormResponseSchema
)

export type ClearCutFormsResponse = z.infer<typeof clearCutFormsResponseSchema>

export const clearCutFormCreateSchema = clearCutFormResponseSchema.omit({
	id: true,
	createdAt: true,
	etag: true,
	reportId: true
})

export type ClearCutFormCreate = z.infer<typeof clearCutFormCreateSchema>
