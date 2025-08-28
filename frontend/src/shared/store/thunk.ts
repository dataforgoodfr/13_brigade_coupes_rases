import {
	type ActionReducerMapBuilder,
	createAsyncThunk,
	type Draft,
} from "@reduxjs/toolkit";
import { isUndefined } from "es-toolkit";
import type { KyInstance } from "ky";
import { HTTPError } from "ky";
import type { KyOptions } from "node_modules/ky/distribution/types/options";
import type z from "zod";
import { setError, setLoading, setSuccess } from "@/shared/api/api";
import type { RequestedContent } from "@/shared/api/types";
import {
	type LocalStorageRepository,
	localStorageRepository,
} from "@/shared/localStorage";
import type { RootState } from "@/shared/store/store";

const createAppThunk = createAsyncThunk.withTypes<{
	state: RootState;
	extra: { api: (options?: KyOptions) => KyInstance };
}>();
type AppThunk<Returned, ThunkArg> = ReturnType<
	typeof createAppThunk<Returned, ThunkArg>
>;
type PayloadCreator<Returned, ThunkArg> = Parameters<
	typeof createAppThunk<Returned, ThunkArg>
>[1];
type CreateAppThunkOptions<Returned, ThunkArg> = Parameters<
	typeof createAppThunk<Returned, ThunkArg>
>[2];
export const createAppAsyncThunk = <Returned, ThunkArg = void>(
	prefix: string,
	payloadCreator: PayloadCreator<Returned, ThunkArg>,
	options?: CreateAppThunkOptions<Returned, ThunkArg>,
) =>
	createAppThunk<Returned, ThunkArg>(
		prefix,
		async (arg, api): Promise<Returned> => {
			try {
				return (await payloadCreator(arg, api)) as Returned;
			} catch (e) {
				if (e instanceof HTTPError) {
					const apiError = await e.response.json();
					api.rejectWithValue(apiError);
				}
				throw e;
			}
		},
		options,
	);

type CommonOptions<Returned> = {
	schema: z.ZodType<Returned>;
};
type WithStorage<Returned> = {
	type: "controlled";
	storage: LocalStorageRepository<Returned>;
};
type WithKey = {
	type: "uncontrolled";
	key: string;
};
type Options<Returned> = CommonOptions<Returned> &
	(WithStorage<Returned> | WithKey);

function buildStorage<Returned>(
	options: WithKey | WithStorage<Returned>,
): LocalStorageRepository<Returned> {
	return options.type === "controlled"
		? options.storage
		: localStorageRepository<Returned>(options.key);
}
export function withStorageActionCreator<Returned, ThunkArg = void>(
	innerCreator: PayloadCreator<Returned, ThunkArg>,
	{ schema, ...options }: Options<Returned>,
): PayloadCreator<Returned, ThunkArg> {
	const storage = buildStorage(options);
	return async (arg, api) => {
		try {
			const returned = (await innerCreator(arg, api)) as Returned;
			storage.setToLocalStorage(returned);
			return returned;
		} catch (e) {
			const found = storage.getFromLocalStorage(schema);
			if (isUndefined(found)) {
				throw e;
			}
			return found;
		}
	};
}
type StorageIdOptions<Returned> = Options<Returned> & {
	getId: (value: { id: string }) => string;
};
export function withIdStorageActionCreator<
	Returned,
	ThunkArg extends { id: string },
>(
	innerCreator: PayloadCreator<Returned, ThunkArg>,
	{ schema, getId, ...options }: StorageIdOptions<Returned>,
): PayloadCreator<Returned, ThunkArg> {
	const storage = buildStorage(options);
	return async (arg, api) => {
		try {
			const returned = (await innerCreator(arg, api)) as Returned;
			storage.setToLocalStorageById(getId(arg), returned);
			return returned;
		} catch (e) {
			const found = storage.getFromLocalStorageById(getId(arg), schema);
			if (isUndefined(found)) {
				throw e;
			}
			return found;
		}
	};
}
const CASES = ["pending", "fulfilled", "rejected"] as const;
type Case = (typeof CASES)[number];
export const addRequestedContentCases = <State, Value, Error, ThunkArg = void>(
	builder: ActionReducerMapBuilder<State>,
	thunk: AppThunk<Value, ThunkArg>,
	accessor: (state: Draft<State>) => RequestedContent<Value, Error | undefined>,
	{
		cases = CASES,
		errorSchema,
	}: { errorSchema?: z.ZodType<Error>; cases?: readonly Case[] } = {
		cases: CASES,
	},
) => {
	if (cases?.includes("pending")) {
		builder.addCase(thunk.pending, (state) => {
			setLoading(accessor(state));
		});
	}
	if (cases?.includes("fulfilled")) {
		builder.addCase(thunk.fulfilled, (state, { payload }) => {
			setSuccess(accessor(state), payload);
		});
	}
	if (cases?.includes("rejected")) {
		builder.addCase(thunk.rejected, (state, { payload }) => {
			setError(
				accessor(state),
				isUndefined(payload)
					? undefined
					: (errorSchema?.safeParse(payload).data ?? (payload as Error)),
			);
		});
	}
	return builder;
};
