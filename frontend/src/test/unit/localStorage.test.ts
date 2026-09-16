import { beforeEach, describe, expect, it } from "vitest"
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
		localStorage.setItem("unit-test", "{not json")
		expect(repo.getFromLocalStorage(schema)).toBeUndefined()
		localStorage.setItem("unit-test", JSON.stringify({ wrong: 1 }))
		expect(repo.getFromLocalStorage(schema)).toBeUndefined()
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
		repo.syncStorage(["1"], schema)
		expect(repo.getFromLocalStorageById("2", schema)).toBeUndefined()
	})
})
