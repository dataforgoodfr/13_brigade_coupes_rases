import { departmentSchema } from "@/shared/store/referential/referential";
import { z } from "zod";

export const loginRequestSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export const ROLES = ["volunteer", "administrator"] as const;
export const roleSchema = z.enum(ROLES);

export type Role = z.infer<typeof roleSchema>;
export const commonUserSchema = z.object({
	login: z.string(),
	email: z.string(),
	avatarUrl: z.string().url().optional(),
});
const volunteerResponseSchema = z.object({
	affectedDepartments: z.array(z.string()).optional(),
	role: roleSchema.extract(["volunteer"]),
});
const administratorResponseSchema = z.object({
	role: roleSchema.extract(["administrator"]),
});
const specificUserPropertiesSchema = z.discriminatedUnion("role", [
	volunteerResponseSchema,
	administratorResponseSchema,
]);

export const userResponseSchema = commonUserSchema.and(
	specificUserPropertiesSchema,
);
const enrichedVolunteerSchema = z.object({
	role: roleSchema.extract(["volunteer"]),
	affectedDepartments: departmentSchema.array(),
});
export const userSchema = commonUserSchema.and(
	z.discriminatedUnion("role", [
		enrichedVolunteerSchema,
		administratorResponseSchema,
	]),
);
export type User = z.infer<typeof userSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type Volunteer = UserResponse & { role: "volunteer" };
export type Administrator = UserResponse & { role: "administrator" };
