import { createAsyncThunk } from "@reduxjs/toolkit";
import type { KyInstance } from "ky";
import type { RootState } from "@/shared/store/store";

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
	state: RootState;
	extra: { api: () => KyInstance };
}>();
