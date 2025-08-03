import { z } from "zod";
import { clearCutStatusSchema } from "@/features/clear-cut/store/clear-cuts";
import { boundsSchema } from "./types";

const filtersRequestSchema = z.object({
	cutYears: z.array(z.number()),
	minAreaHectare: z.number().optional(),
	maxAreaHectare: z.number().optional(),
	geoBounds: boundsSchema.optional(),
	departmentsIds: z.array(z.string()).optional(),
	statuses: clearCutStatusSchema.array().optional(),
	excessiveSlope: z.boolean().optional(),
	favorite: z.boolean().optional(),
	hasEcologicalZonings: z.boolean().optional(),
	withPoints: z.boolean().optional(),
});

export type FiltersRequest = z.infer<typeof filtersRequestSchema>;

export const filtersResponseSchema = z.object({
	rulesIds: z.array(z.string()).optional(),
	cutYears: z.array(z.number()),
	departmentsIds: z.string().array().optional(),
	statuses: clearCutStatusSchema.array().optional(),
	areaRange: z.object({ min: z.number(), max: z.number() }),
	excessiveSlope: z.boolean().optional(),
	favorite: z.boolean().optional(),
	hasEcologicalZonings: z.boolean().optional(),
});

export type FiltersResponse = z.infer<typeof filtersResponseSchema>;
