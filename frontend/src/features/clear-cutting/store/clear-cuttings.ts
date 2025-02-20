import { string, z } from "zod";
import { pointSchema } from "./types";

export const clearCuttingStatusSchema = z.enum([
  "toValidate",
  "validated",
  "rejected",
  "waitingInformation",
]);

export type ClearCuttingStatus = z.infer<typeof clearCuttingStatusSchema>;

const clearCuttingPointsSchema = z.array(z.number());
export type ClearCuttingPoint = z.infer<typeof clearCuttingPointsSchema>;
const ecologicalZoningSchema = z.object({
  id: z.string(),
  name: z.string(),
  link: z.string().url(),
  logo: z.string().url(),
});

const clearCuttingPreviewSchema = z.object({
  id: z.string(),
  geoCoordinates: z.array(pointSchema),
  center: pointSchema,
  name: z.string().optional(),
  cutYear: z.number(),
  address: z.object({
    postalCode: z.string(),
    city: z.string(),
    country: z.string(),
  }),
  imageUrl: z.string().url().optional(),
  imagesCnt: z.number().optional(),
  status: clearCuttingStatusSchema,
});
export type ClearCuttingPreview = z.infer<typeof clearCuttingPreviewSchema>;

export const clearCuttingSchema = z.object({
  id: z.string(),
  geoCoordinates: z.array(pointSchema),
  name: z.string().optional(),
  cutYear: z.number(),
  address: z.object({
    streetName: z.string(),
    streetNumber: z.string(),
    postalCode: z.string(),
    city: z.string(),
    state: z.string().optional(),
    country: z.string(),
  }),
  cadastralParcel: z
    .object({
      id: string(),
      surfaceKm: z.number(),
    })
    .optional(),
  ecologicalZonings: z.array(z.string()).optional(),
  waterCourses: z.array(z.string()).optional(),
  abusiveTags: z.array(z.string()).optional(),
  customTags: z.array(z.string()).optional(),
  imageUrls: z.array(z.string().url()),
  status: clearCuttingStatusSchema,
});

export type ClearCutting = z.infer<typeof clearCuttingSchema>;

const waterCourseSchema = z.object({
  id: z.string(),
  geoCoordinates: z.array(pointSchema),
});
export const clearCuttingsResponseSchema = z.object({
  clearCuttingsPoints: z.array(clearCuttingPointsSchema),
  clearCuttingPreviews: z.array(clearCuttingPreviewSchema),
  waterCourses: z.array(waterCourseSchema),
  ecologicalZoning: z.array(ecologicalZoningSchema),
});

export type ClearCuttingsResponse = z.infer<typeof clearCuttingsResponseSchema>;
