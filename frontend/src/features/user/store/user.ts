import { z } from "zod";

export const loginRequestSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const roleSchema = z.enum(["visitor", "volunteer", "administrator"]);

export type Role = z.infer<typeof roleSchema>;
export const commonUserSchema = z.object({
	login: z.string(),
	email: z.string(),
	avatarUrl: z.string().url().optional(),
});

const specificUserPropertiesSchema = z.discriminatedUnion("role", [
	z.object({
		departments: z.array(z.string().uuid()),
		role: roleSchema.extract(["volunteer"]),
	}),
	z.object({ role: roleSchema.exclude(["volunteer"]) }),
]);

export const userSchema = commonUserSchema.and(specificUserPropertiesSchema);

export type User = z.infer<typeof userSchema>;
export type Volunteer = User & { role: "volunteer" };
export type Administrator = User & { role: "administrator" };
