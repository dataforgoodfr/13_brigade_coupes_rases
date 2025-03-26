import { z } from "zod";
import { boundsSchema } from "./types";

const filtersRequestSchema = z.object({
	cutYears: z.array(z.number()),
	areas: z.number().array().optional(),
	geoBounds: boundsSchema,
	departments: z.array(z.string()).optional(),
	statuses: z.array(z.string()).optional(),
	excessiveSlop: z.boolean().optional(),
	favorite: z.boolean().optional(),
	ecologicalZoning: z.boolean().optional(),
});

export type FiltersRequest = z.infer<typeof filtersRequestSchema>;

export const filtersResponseSchema = z.object({
	tags: z.array(z.string()).optional(),
	cutYears: z.array(z.number()),
	departments: z.string().array().optional(),
	statuses: z.string().array().optional(),
	areaPresetsHectare: z.array(z.number()),
	excessiveSlop: z.boolean().optional(),
	favorite: z.boolean().optional(),
	ecologicalZoning: z.boolean().optional(),
});

export type FiltersResponse = z.infer<typeof filtersResponseSchema>;
