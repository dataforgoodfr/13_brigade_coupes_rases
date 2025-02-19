import type { RootState } from "@/shared/store/store";
import { createDraftSafeSelector } from "@reduxjs/toolkit";

export const createTypedDraftSafeSelector =
	createDraftSafeSelector.withTypes<RootState>();
