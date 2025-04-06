import { clearCuttingStatusSchema } from "@/features/clear-cutting/store/clear-cuttings";
import { z } from "zod";
import { boundsSchema } from "./types";

const filtersRequestSchema = z.object({
	cut_years: z.array(z.number()),
	areas: z.number().array().optional(),
	geoBounds: boundsSchema,
	departments_ids: z.array(z.string()).optional(),
	statuses: clearCuttingStatusSchema.array().optional(),
	excessive_slop: z.boolean().optional(),
	favorite: z.boolean().optional(),
	has_ecological_zonings: z.boolean().optional(),
});

export type FiltersRequest = z.infer<typeof filtersRequestSchema>;

export const filtersResponseSchema = z.object({
	tags_ids: z.array(z.string()).optional(),
	cut_years: z.array(z.number()),
	departments_ids: z.string().array().optional(),
	statuses: clearCuttingStatusSchema.array().optional(),
	area_preset_hectare: z.array(z.number()),
	excessive_slop: z.boolean().optional(),
	favorite: z.boolean().optional(),
	has_ecological_zonings: z.boolean().optional(),
});

export type FiltersResponse = z.infer<typeof filtersResponseSchema>;
