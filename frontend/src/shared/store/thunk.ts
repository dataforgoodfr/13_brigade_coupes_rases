import type { RootState } from "@/shared/store/store";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { KyInstance } from "ky";

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
	state: RootState;
	extra: { api: () => KyInstance };
}>();
