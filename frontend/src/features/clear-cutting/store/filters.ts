import { z } from "zod";
import { boundsSchema } from "./types";

const filtersRequestSchema = z.object({
	cutYears: z.array(z.number()),
	areaMeters: z.number().optional(),
	geoBounds: boundsSchema,
	ecologicalZoning: z.array(z.string()).optional(),
	departments: z.array(z.string()).optional(),
});

export type FiltersRequest = z.infer<typeof filtersRequestSchema>;

export const filtersResponseSchema = z.object({
	tags: z.array(z.string()).optional(),
	cutYears: z.array(z.number()),
	ecologicalZoning: z.string().array().optional(),
	departments: z.string().array().optional(),
	status: z.string().array().optional(),
	areaPresetsHectare: z.array(z.number()),
});

export type FiltersResponse = z.infer<typeof filtersResponseSchema>;
