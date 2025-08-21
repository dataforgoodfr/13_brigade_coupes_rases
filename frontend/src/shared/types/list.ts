import z from "zod";

export const SORTS = ["asc", "desc"] as const;
export const sortSchema = z.enum(SORTS);
export type Sort = z.infer<typeof sortSchema>;
