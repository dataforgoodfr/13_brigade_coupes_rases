import { endpoints } from "@/features/clear-cutting/store/api";
import type { ClearCutting } from "@/features/clear-cutting/store/clear-cuttings";
import { createSlice } from "@reduxjs/toolkit";

const initialState: Partial<ClearCutting> = {};
export const clearCuttingSlice = createSlice({
	name: "clear-cutting",
	initialState,
	reducers: {},
	extraReducers: (builder) =>
		builder.addMatcher(
			endpoints.getClearCutting.matchFulfilled,
			(state, { payload }) => {
				state.id = payload.id;
			},
		),
});
