import { beforeEach, describe, expect, it, vi } from "vitest"
import z from "zod"

import { localStorageRepository } from "@/shared/localStorage"

const schema = z.object({ name: z.string() })
const repo = localStorageRepository<z.infer<typeof schema>>("unit-test")

describe("localStorageRepository", () => {
	beforeEach(() => localStorage.clear())

	it("stores and reads a value, undefined removes it", () => {
		repo.setToLocalStorage({ name: "a" })
		expect(repo.getFromLocalStorage(schema)).toEqual({ name: "a" })
		repo.setToLocalStorage(undefined)
		expect(repo.getFromLocalStorage(schema)).toBeUndefined()
	})

	it("drops a corrupted or outdated entry instead of throwing", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined)
		localStorage.setItem("unit-test", "{not json")
		expect(repo.getFromLocalStorage(schema)).toBeUndefined()
		localStorage.setItem("unit-test", JSON.stringify({ wrong: 1 }))
		expect(repo.getFromLocalStorage(schema)).toBeUndefined()
		expect(consoleError).toHaveBeenCalledTimes(2)
		consoleError.mockRestore()
	})

	it("keeps a record of entries by id", () => {
		repo.setToLocalStorageById("1", { name: "one" })
		repo.setToLocalStorageById("2", { name: "two" })
		expect(repo.getFromLocalStorageById("2", schema)).toEqual({ name: "two" })
		expect(
			repo
				.getValuesFromStorage(schema)
				.map((v) => v.name)
				.sort()
		).toEqual(["one", "two"])
		repo.pruneStorage((id) => id === "1", schema)
		expect(repo.getFromLocalStorageById("1", schema)).toEqual({ name: "one" })
		expect(repo.getFromLocalStorageById("2", schema)).toBeUndefined()
	})

	it("skips an invalid entry without losing the others", () => {
		const consoleWarn = vi
			.spyOn(console, "warn")
			.mockImplementation(() => undefined)
		localStorage.setItem(
			"unit-test",
			JSON.stringify({ "1": { name: "one" }, "2": { old: "format" } })
		)
		expect(repo.getValuesFromStorage(schema)).toEqual([{ name: "one" }])
		expect(repo.getFromLocalStorageById("1", schema)).toEqual({ name: "one" })

		// Writing another entry keeps the invalid one as it was
		repo.setToLocalStorageById("3", { name: "three" })
		expect(JSON.parse(localStorage.getItem("unit-test") ?? "{}")).toEqual({
			"1": { name: "one" },
			"2": { old: "format" },
			"3": { name: "three" }
		})
		consoleWarn.mockRestore()
	})

	it("never prunes an entry it cannot read", () => {
		localStorage.setItem(
			"unit-test",
			JSON.stringify({ "1": { name: "one" }, "2": { old: "format" } })
		)
		repo.pruneStorage(() => false, schema)
		expect(JSON.parse(localStorage.getItem("unit-test") ?? "{}")).toEqual({
			"2": { old: "format" }
		})
	})
})
