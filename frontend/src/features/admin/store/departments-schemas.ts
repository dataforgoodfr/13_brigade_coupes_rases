import { z } from "zod";

const departmentsRequestSchema = z.object({
	id: z.string(),
	code: z.string(),
	name: z.string(),
});

export type Department = z.infer<typeof departmentsRequestSchema>;

export const departmentsListResponseSchema = z.object({
	departments: z.array(departmentsRequestSchema),
});

export type DepartmentsListResponse = z.infer<
	typeof departmentsListResponseSchema
>;
