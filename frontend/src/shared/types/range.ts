import { z } from "zod"

export const rangeSchema = z.object({ min: z.number(), max: z.number() })

export type Range = z.infer<typeof rangeSchema>
