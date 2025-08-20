import { createAsyncThunk } from "@reduxjs/toolkit";
import type { KyInstance } from "ky";
import { HTTPError } from "ky";
import type { KyOptions } from "node_modules/ky/distribution/types/options";
import type { RootState } from "@/shared/store/store";

const createAppThunk = createAsyncThunk.withTypes<{
	state: RootState;
	extra: { api: (options?: KyOptions) => KyInstance };
}>();
export const createAppAsyncThunk = <Returned, ThunkArg = void>(
	prefix: string,
	payloadCreator: Parameters<typeof createAppThunk<Returned, ThunkArg>>[1],
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
	);
