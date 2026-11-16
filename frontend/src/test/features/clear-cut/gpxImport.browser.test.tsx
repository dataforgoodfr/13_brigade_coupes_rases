import { screen } from "@testing-library/dom"
import { IntlProvider } from "react-intl"
import { describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import { Toaster } from "@/components/ui/toaster"
import { GpxImportButton } from "@/features/clear-cut/components/map/GpxImportButton"

const trkpts = (latLons: [number, number][]) =>
	latLons.map(([lat, lon]) => `<trkpt lat="${lat}" lon="${lon}"/>`).join("")
const SQUARE: [number, number][] = [
	[44, -0.8],
	[44, -0.7975],
	[44.0018, -0.7975],
	[44.0018, -0.8],
	[44.00001, -0.80001]
]
const OPEN: [number, number][] = [
	[44, -0.8],
	[44.02, -0.8],
	[44.02, -0.78]
]
const track = (name: string, latLons: [number, number][]) =>
	`<trk><name>${name}</name><trkseg>${trkpts(latLons)}</trkseg></trk>`
const gpxFile = (body: string) =>
	new File(
		[`<gpx xmlns="http://www.topografix.com/GPX/1/1">${body}</gpx>`],
		"sortie.gpx"
	)

const renderButton = async (onPolygon = vi.fn()) => {
	await render(
		<IntlProvider locale="fr">
			<GpxImportButton onPolygon={onPolygon} />
			<Toaster />
		</IntlProvider>
	)
	return onPolygon
}
const pick = (file: File) =>
	userEvent.upload(screen.getByLabelText("Fichier GPX"), file)

describe("GpxImportButton", () => {
	it("hands over the perimeter of a single closed trace", async () => {
		const onPolygon = await renderButton()
		await pick(gpxFile(track("Tour", SQUARE)))
		await expect.poll(() => onPolygon.mock.calls.length).toBe(1)
		const [polygon, trace] = onPolygon.mock.calls[0]
		expect(polygon.type).toBe("MultiPolygon")
		expect(trace.name).toBe("Tour")
	})

	it("lets the user choose among several traces", async () => {
		const onPolygon = await renderButton()
		await pick(gpxFile(track("Aller", OPEN) + track("Tour", SQUARE)))
		expect(await screen.findByText("Choisir une trace")).toBeInTheDocument()
		expect(screen.getByText(/trace ouverte/)).toBeInTheDocument()
		// Only the closed trace can be used
		const buttons = screen.getAllByRole("button", { name: "Utiliser" })
		expect(buttons).toHaveLength(1)
		await userEvent.click(buttons[0])
		await expect.poll(() => onPolygon.mock.calls.length).toBe(1)
		expect(onPolygon.mock.calls[0][1].name).toBe("Tour")
	})

	it("explains why a single trace cannot be used", async () => {
		const onPolygon = await renderButton()
		await pick(gpxFile(track("Aller", OPEN)))
		expect(
			await screen.findByText(
				/ne peut pas devenir un périmètre : trace ouverte/
			)
		).toBeInTheDocument()
		expect(onPolygon).not.toHaveBeenCalled()
	})

	it("rejects a file that is not GPX", async () => {
		const onPolygon = await renderButton()
		await pick(new File(["pas du GPX"], "photo.jpg"))
		expect(
			await screen.findByText("Ce fichier n'est pas un fichier GPX lisible.")
		).toBeInTheDocument()
		expect(onPolygon).not.toHaveBeenCalled()
	})
})
