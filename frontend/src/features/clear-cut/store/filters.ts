import { clearCutStatusSchema } from "@/features/clear-cut/store/clear-cuts";
import { z } from "zod";
import { boundsSchema } from "./types";

const filtersRequestSchema = z.object({
	cut_years: z.array(z.number()),
	min_area_hectare: z.number().optional(),
	max_area_hectare: z.number().optional(),
	geoBounds: boundsSchema.optional(),
	departments_ids: z.array(z.string()).optional(),
	statuses: clearCutStatusSchema.array().optional(),
	excessive_slope: z.boolean().optional(),
	favorite: z.boolean().optional(),
	has_ecological_zonings: z.boolean().optional(),
	with_points: z.boolean().optional(),
});

export type FiltersRequest = z.infer<typeof filtersRequestSchema>;

export const filtersResponseSchema = z.object({
	rules_ids: z.array(z.string()).optional(),
	cut_years: z.array(z.number()),
	departments_ids: z.string().array().optional(),
	statuses: clearCutStatusSchema.array().optional(),
	area_range: z.object({min: z.number(), max: z.number()}),
	excessive_slope: z.boolean().optional(),
	favorite: z.boolean().optional(),
	has_ecological_zonings: z.boolean().optional(),
});

export type FiltersResponse = z.infer<typeof filtersResponseSchema>;
