import { departmentSchema } from "@/shared/store/referential/referential";
import { z } from "zod";

export const loginRequestSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export const ROLES = ["volunteer", "admin"] as const;
export const roleSchema = z.enum(ROLES);

export type Role = z.infer<typeof roleSchema>;
export const commonUserSchema = z.object({
	login: z.string(),
	email: z.string(),
	avatarUrl: z.string().url().optional(),
	departments: z.array(z.string()).optional(),
});
const volunteerResponseSchema = z.object({
	role: roleSchema.extract(["volunteer"]),
});
const administratorResponseSchema = z.object({
	role: roleSchema.extract(["admin"]),
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
});

export const userSchema = commonUserSchema
	.omit({ departments: true })
	.and(z.object({ departments: departmentSchema.array() }))
	.and(
		z.discriminatedUnion("role", [
			enrichedVolunteerSchema,
			administratorResponseSchema,
		]),
	);

export const tokenSchema = z.object({ access_token: z.string().jwt() });
export type User = z.infer<typeof userSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type TokenResponse = z.infer<typeof tokenSchema>;
export type Volunteer = UserResponse & { role: "volunteer" };
export type Administrator = UserResponse & { role: "admin" };
