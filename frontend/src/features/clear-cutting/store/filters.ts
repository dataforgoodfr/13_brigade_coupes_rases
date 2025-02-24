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

const tagSchema = z.object({
	id: z.string(),
	name: z.string(),
	isAbusive: z.boolean(),
});
export type Tag = z.infer<typeof tagSchema>;

const ecologicalZoningSchema = z.object({
	id: z.string(),
	name: z.string(),
});
export type EcologicalZoning = z.infer<typeof ecologicalZoningSchema>;

export const filtersResponseSchema = z.object({
	tags: z.array(tagSchema),
	cutYears: z.array(z.number()),
	ecologicalZoning: z.record(z.string().uuid(), z.string()),
	departments: z.record(z.string().uuid(), z.string()),
	region: z.record(z.string().uuid(), z.string()),
	status: z.record(z.string().uuid(), z.string()),
});

export type FiltersResponse = z.infer<typeof filtersResponseSchema>;
