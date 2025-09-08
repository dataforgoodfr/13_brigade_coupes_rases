import { isEqual } from "es-toolkit";
import z from "zod";

export type ChangeTracking<Original, Current> = {
	original: Original;
	current: Current;
	hasChanged: boolean;
};

export const toChangeTrackingSchema = <
	Original extends z.ZodType,
	Current extends z.ZodType,
>(
	original: Original,
	current: Current,
) => z.object({ original, current, hasChanged: z.boolean() });

type ChangeTrackingObject<T extends z.ZodObject> = {
	[K in keyof T["shape"]]: ChangeTracking<
		T["shape"][K],
		T["shape"][K] | undefined
	>;
};
export const toChangeTrackingObjectSchema = <Original extends z.ZodObject>(
	original: Original,
) => {
	const object = Object.fromEntries(
		Object.entries(original.shape).map(([key, value]) => [
			key,
			toChangeTrackingSchema(value, value.optional()),
		]),
	) as unknown as ChangeTrackingObject<Original>;
	return z.object(object);
};

export function updateChangeTracking<Original, Current>(
	changeTracking: ChangeTracking<Original, Current>,
	current: Current,
	hasChanged: (original: Original, current: Current) => boolean = isEqual,
): ChangeTracking<Original, Current> {
	return {
		current,
		original: changeTracking.original,
		hasChanged: hasChanged(changeTracking.original, current),
	};
}

export function createChangeTracking<Original>(
	original: Original,
): ChangeTracking<Original, Original | undefined> {
	return { original, current: original, hasChanged: false };
}
