import { describe, expect, it } from "vitest"

import {
	booleanToSelectableItem,
	DEFAULT_EVENTUALLY_BOOLEAN,
	listToSelectableItems,
	recordToSelectableItems,
	updateEventuallyBooleanSelectableItem
} from "@/shared/items"

describe("listToSelectableItems", () => {
	it("wraps each item, unselected by default", () => {
		expect(listToSelectableItems([1, 2])).toEqual([
			{ isSelected: false, item: 1 },
			{ isSelected: false, item: 2 }
		])
		expect(listToSelectableItems(["a"], true)).toEqual([
			{ isSelected: true, item: "a" }
		])
		expect(listToSelectableItems(undefined)).toEqual([])
	})
})

describe("recordToSelectableItems", () => {
	it("keeps the values and drops the keys", () => {
		expect(recordToSelectableItems({ a: 1, b: 2 })).toEqual([
			{ isSelected: false, item: 1 },
			{ isSelected: false, item: 2 }
		])
		expect(recordToSelectableItems(undefined)).toEqual([])
	})
})

describe("eventually boolean items", () => {
	it("selects exactly one of true / false / undefined", () => {
		for (const value of [true, false, undefined]) {
			const items = booleanToSelectableItem(value)
			expect(items.filter((i) => i.isSelected).map((i) => i.item)).toEqual([
				value
			])
		}
	})

	it("defaults to undefined", () => {
		expect(booleanToSelectableItem(undefined)).toEqual(
			DEFAULT_EVENTUALLY_BOOLEAN
		)
	})

	it("moves the selection without mutating the input", () => {
		const updated = updateEventuallyBooleanSelectableItem(
			{ isSelected: true, item: false },
			DEFAULT_EVENTUALLY_BOOLEAN
		)
		expect(updated.map((i) => i.isSelected)).toEqual([false, true, false])
		expect(DEFAULT_EVENTUALLY_BOOLEAN.map((i) => i.isSelected)).toEqual([
			false,
			false,
			true
		])
	})
})
