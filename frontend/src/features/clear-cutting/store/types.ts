import { z } from "zod";

export const pointSchema = z.tuple([z.number(), z.number()]);

export type Point = z.infer<typeof pointSchema>;

export const boundsSchema = z.tuple([pointSchema, pointSchema]);
export type Bounds = z.infer<typeof boundsSchema>;
