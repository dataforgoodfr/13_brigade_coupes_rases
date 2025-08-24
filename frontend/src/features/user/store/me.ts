import { z } from "zod";
import { toStringApiErrorSchema } from "@/shared/api/api";
import { departmentSchema } from "@/shared/store/referential/referential";

export const loginRequestSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export const ROLES = ["volunteer", "admin"] as const;
export const roleSchema = z.enum(ROLES);

export type Role = z.infer<typeof roleSchema>;

export const commonMeSchema = z.object({
	login: z.string(),
	email: z.string(),
	avatarUrl: z.string().url().optional(),
	departments: z.array(z.string()).optional(),
	favorites: z.string().array(),
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

export const meResponseSchema = commonMeSchema.and(
	specificUserPropertiesSchema,
);

export const updateMeRequestSchema = z.object({
	favorites: z.string().array(),
});
const enrichedVolunteerSchema = z.object({
	role: roleSchema.extract(["volunteer"]),
});

export const meSchema = commonMeSchema
	.omit({ departments: true })
	.and(z.object({ departments: departmentSchema.array() }))
	.and(
		z.discriminatedUnion("role", [
			enrichedVolunteerSchema,
			administratorResponseSchema,
		]),
	);

export const tokenSchema = z.object({ accessToken: z.jwt() });
export type Me = z.infer<typeof meSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type UpdateMeRequest = z.infer<typeof updateMeRequestSchema>;
export type TokenResponse = z.infer<typeof tokenSchema>;
export type Volunteer = MeResponse & { role: "volunteer" };
export type Administrator = MeResponse & { role: "admin" };

export const credentialErrorSchema = toStringApiErrorSchema(
	z.literal("INVALID_CREDENTIALS"),
);

export type CredentialError = z.infer<typeof credentialErrorSchema>;
export const invalidTokenSchema = toStringApiErrorSchema(
	z.literal("INVALID_TOKEN"),
);
export type TokenError = z.infer<typeof invalidTokenSchema>;

export const meErrorSchema = z.union([
	credentialErrorSchema,
	invalidTokenSchema,
]);
export type MeError = z.infer<typeof meErrorSchema>;
