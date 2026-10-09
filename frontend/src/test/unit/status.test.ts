import { describe, expect, it } from "vitest"

import { canBeReopened } from "@/features/clear-cut/store/status"

describe("canBeReopened", () => {
	it("accepts decided reports, held or not", () => {
		expect(canBeReopened("validated", false)).toBe(true)
		expect(canBeReopened("rejected", true)).toBe(true)
	})

	it("accepts a report in progress that lost its holder", () => {
		expect(canBeReopened("in_progress", false)).toBe(true)
		expect(canBeReopened("waiting_for_validation", false)).toBe(true)
	})

	it("refuses reports that the workflow can still move", () => {
		expect(canBeReopened("to_validate", false)).toBe(false)
		expect(canBeReopened("in_progress", true)).toBe(false)
		expect(canBeReopened("waiting_for_validation", true)).toBe(false)
	})
})
