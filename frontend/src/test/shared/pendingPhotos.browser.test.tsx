import { beforeEach, describe, expect, it } from "vitest"

import {
	addPendingPhoto,
	listPendingPhotos,
	removePendingPhoto
} from "@/shared/pendingPhotos"

const photo = (name: string) => new File([name], name, { type: "image/jpeg" })

describe("pending photos", () => {
	beforeEach(async () => {
		for (const field of ["a", "b"]) {
			for (const p of await listPendingPhotos("R1", field)) {
				await removePendingPhoto(p.id)
			}
		}
	})

	it("keeps photos per report and field, in the order they were taken", async () => {
		await addPendingPhoto({ reportId: "R1", field: "a", file: photo("1.jpg") })
		await addPendingPhoto({ reportId: "R1", field: "b", file: photo("2.jpg") })
		await addPendingPhoto({ reportId: "R1", field: "a", file: photo("3.jpg") })

		const kept = await listPendingPhotos("R1", "a")
		expect(kept.map((p) => p.file.name)).toEqual(["1.jpg", "3.jpg"])
		expect(await kept[0].file.text()).toBe("1.jpg")
	})

	it("forgets a photo once removed", async () => {
		const added = await addPendingPhoto({
			reportId: "R1",
			field: "a",
			file: photo("1.jpg")
		})
		await removePendingPhoto(added.id)
		expect(await listPendingPhotos("R1", "a")).toEqual([])
	})
})
