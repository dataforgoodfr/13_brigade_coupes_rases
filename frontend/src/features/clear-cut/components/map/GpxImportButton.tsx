import { Upload } from "lucide-react"
import { type ChangeEvent, useRef, useState } from "react"
import { FormattedNumber } from "react-intl"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { type GpxPolygon, type GpxTrace, readGpx } from "@/shared/gpx"

/** A GPS recording of a few hours weighs well under a megabyte. */
const MAX_GPX_BYTES = 10 * 1024 * 1024

/**
 * Picks a GPX file and hands over the perimeter drawn by one of its traces.
 * With several traces, the user chooses one; the unusable ones say why.
 */
export function GpxImportButton({
	onPolygon,
	disabled
}: {
	onPolygon: (polygon: GpxPolygon, trace: GpxTrace) => void
	disabled?: boolean
}) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [traces, setTraces] = useState<GpxTrace[]>()
	const { toast } = useToast()

	const fail = (description: string) =>
		toast({
			id: "gpx-import-error",
			title: "Import GPX impossible",
			description,
			variant: "destructive"
		})

	const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
		const input = event.target
		const file = input.files?.[0]
		if (!file) return
		let text: string
		try {
			if (file.size > MAX_GPX_BYTES) {
				fail("Le fichier dépasse 10 Mo.")
				return
			}
			text = await file.text()
		} catch {
			fail("Le fichier n'a pas pu être lu.")
			return
		} finally {
			// Choosing the same file again must trigger a new import
			input.value = ""
		}
		const result = readGpx(text)
		if (!result.ok) {
			fail(result.error)
			return
		}
		if (result.traces.length > 1) {
			setTraces(result.traces)
			return
		}
		const [trace] = result.traces
		if (trace.polygon) onPolygon(trace.polygon, trace)
		else fail(`La trace ne peut pas devenir un périmètre : ${trace.problem}.`)
	}

	const choose = (trace: GpxTrace) => {
		if (!trace.polygon) return
		setTraces(undefined)
		onPolygon(trace.polygon, trace)
	}

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				// No `accept`: Android greys out .gpx files, whose type it ignores
				className="hidden"
				aria-label="Fichier GPX"
				onChange={handleFile}
			/>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={disabled}
				onClick={() => inputRef.current?.click()}
			>
				<Upload size={14} className="mr-1" />
				Importer un GPX
			</Button>
			<Dialog
				open={traces !== undefined}
				onOpenChange={(open) => {
					if (!open) setTraces(undefined)
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Choisir une trace</DialogTitle>
						<DialogDescription>
							Le fichier contient plusieurs traces. Seule une trace fermée, qui
							ne se croise pas, peut devenir le périmètre.
						</DialogDescription>
					</DialogHeader>
					<ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
						{traces?.map((trace, index) => (
							<li
								// Two traces may share a name
								// biome-ignore lint/suspicious/noArrayIndexKey: the list never changes once shown
								key={index}
								className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
							>
								<div className="flex flex-col">
									<span className="font-medium">{trace.name}</span>
									<span className="text-xs text-neutral-600">
										{trace.pointCount} points,{" "}
										<FormattedNumber
											value={trace.lengthMeters / 1000}
											maximumFractionDigits={1}
										/>{" "}
										km
										{trace.polygon ? (
											<>
												{", "}
												<FormattedNumber
													value={trace.areaHectare}
													maximumFractionDigits={1}
												/>{" "}
												ha
											</>
										) : (
											` — ${trace.problem}`
										)}
									</span>
								</div>
								{trace.polygon && (
									<Button type="button" size="sm" onClick={() => choose(trace)}>
										Utiliser
									</Button>
								)}
							</li>
						))}
					</ul>
				</DialogContent>
			</Dialog>
		</>
	)
}
