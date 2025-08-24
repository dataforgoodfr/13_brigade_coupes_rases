import {
	type ActionReducerMapBuilder,
	createAsyncThunk,
	type Draft,
} from "@reduxjs/toolkit";
import type { KyInstance } from "ky";
import { HTTPError } from "ky";
import type { KyOptions } from "node_modules/ky/distribution/types/options";
import type z from "zod";
import { setError, setLoading, setSuccess } from "@/shared/api/api";
import type { RequestedContent } from "@/shared/api/types";
import type { RootState } from "@/shared/store/store";

const createAppThunk = createAsyncThunk.withTypes<{
	state: RootState;
	extra: { api: (options?: KyOptions) => KyInstance };
}>();
export const createAppAsyncThunk = <Returned, ThunkArg = void>(
	prefix: string,
	payloadCreator: Parameters<typeof createAppThunk<Returned, ThunkArg>>[1],
	options?: Parameters<typeof createAppThunk<Returned, ThunkArg>>[2],
) =>
	createAppThunk<Returned, ThunkArg>(
		prefix,
		async (arg, api): Promise<Returned> => {
			try {
				return (await payloadCreator(arg, api)) as Promise<Returned>;
			} catch (e) {
				if (e instanceof HTTPError) {
					const apiError = await e.response.json();
					return api.rejectWithValue(apiError) as unknown as Promise<Returned>;
				}
				throw e;
			}
		},
		options,
	);

type AppThunk<Returned, ThunkArg> = ReturnType<
	typeof createAppAsyncThunk<Returned, ThunkArg>
>;

const CASES = ["pending", "fulfilled", "rejected"] as const;
type Case = (typeof CASES)[number];
export const addRequestedContentCases = <State, Value, Error, ThunkArg = void>(
	builder: ActionReducerMapBuilder<State>,
	thunk: AppThunk<Value, ThunkArg>,
	accessor: (state: Draft<State>) => RequestedContent<Value, Error>,
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
				errorSchema?.parse(payload) ?? (payload as Error),
			);
		});
	}
	return builder;
};
