import { createDraftSafeSelector } from "@reduxjs/toolkit"

import type { RootState } from "@/shared/store/store"

export const createTypedDraftSafeSelector =
	createDraftSafeSelector.withTypes<RootState>()
