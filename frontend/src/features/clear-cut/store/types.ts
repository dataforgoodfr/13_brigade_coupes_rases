import { z } from "zod";

export const pointTupleSchema = z.tuple([z.number(), z.number()]);

export type Point = z.infer<typeof pointTupleSchema>;

export const pointObjectSchema = z.object({ lat: z.number(), lng: z.number() });
export type PointObject = z.infer<typeof pointObjectSchema>;

export const boundsSchema = z.object({
	sw: pointObjectSchema,
	ne: pointObjectSchema,
});
export type Bounds = z.infer<typeof boundsSchema>;
