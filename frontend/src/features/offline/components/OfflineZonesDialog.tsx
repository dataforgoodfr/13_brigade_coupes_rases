import { Download, Eye, RotateCw, Trash2 } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { useMap } from "react-leaflet"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { useOfflineZones } from "@/features/offline/hooks/useOfflineZones"
import {
	type DownloadProgress,
	type DownloadResult,
	deleteOfflineZone,
	downloadOfflineZone,
	hasRoomFor,
	MAX_ZONE_TILES,
	OFFLINE_SOURCES,
	type OfflineSourceId,
	type OfflineZone,
	planOfflineZone
} from "@/features/offline/tiles/offlineZones"
import { downloadZoneClearCutsThunk } from "@/features/offline/zoneClearCuts"
import { communeNear } from "@/shared/geoplateforme"
import { useAppDispatch } from "@/shared/hooks/store"

const megabytes = (bytes: number) =>
	`${(bytes / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`

const OPTIONAL_SOURCES: OfflineSourceId[] = ["photos-ign", "cadastre"]

/** Safari deletes the data of a site not installed after 7 days without visit. */
const isIosBrowser = () =>
	/iPad|iPhone|iPod/.test(navigator.userAgent) &&
	!window.matchMedia("(display-mode: standalone)").matches

const INTERRUPTIONS: Record<
	NonNullable<DownloadResult["interruption"]>,
	string
> = {
	network: "Réseau perdu : les tuiles reçues sont gardées.",
	storage: "Stockage plein : libérez de la place ou supprimez une zone.",
	cancelled: "Téléchargement annulé : les tuiles reçues sont gardées."
}

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

/**
 * Downloads the zone shown on screen for use without network, and lists the
 * zones already downloaded.
 */
export function OfflineZonesDialog({ open, onOpenChange }: Props) {
	const map = useMap()
	const dispatch = useAppDispatch()
	const zones = useOfflineZones()
	const [options, setOptions] = useState<OfflineSourceId[]>([])
	const [progress, setProgress] = useState<DownloadProgress>()
	const [message, setMessage] = useState<string>()
	const controller = useRef<AbortController>(undefined)
	const downloading = progress !== undefined

	// Recomputed each time the dialog opens, for the view of that moment
	// biome-ignore lint/correctness/useExhaustiveDependencies: open triggers it
	const view = useMemo(() => {
		const bounds = map.getBounds()
		return {
			bounds: {
				south: bounds.getSouth(),
				west: bounds.getWest(),
				north: bounds.getNorth(),
				east: bounds.getEast()
			},
			center: map.getCenter(),
			zoom: map.getZoom()
		}
	}, [map, open])

	const sources: OfflineSourceId[] = ["plan-ign", ...options]
	const plan = planOfflineZone({ name: "", ...view, sources })

	const run = async (zone: OfflineZone) => {
		setMessage(undefined)
		const bytesPerTile =
			zone.sources.reduce(
				(total, source) => total + OFFLINE_SOURCES[source].averageTileBytes,
				0
			) / zone.sources.length
		const remaining = (zone.tileCount - zone.storedTiles) * bytesPerTile
		if (!(await hasRoomFor(remaining))) {
			setMessage("Espace insuffisant sur l'appareil pour cette zone.")
			return
		}
		// Asks the browser not to evict the zones when space runs low
		await navigator.storage?.persist?.().catch(() => false)
		controller.current = new AbortController()
		setProgress({ done: 0, total: zone.tileCount })
		try {
			const result = await downloadOfflineZone(zone, {
				signal: controller.current.signal,
				onProgress: setProgress
			})
			if (result.interruption) {
				setMessage(INTERRUPTIONS[result.interruption])
				return
			}
			const clearCuts = await dispatch(downloadZoneClearCutsThunk(result.zone))
				.unwrap()
				.catch(() => undefined)
			setMessage(
				[
					result.zone.complete
						? `« ${result.zone.name} » est disponible hors ligne.`
						: `${result.failedTiles} tuiles n'ont pas pu être téléchargées : reprenez plus tard.`,
					clearCuts === undefined
						? "Les coupes de la zone n'ont pas pu être enregistrées : reprenez plus tard."
						: `${clearCuts} coupe${clearCuts > 1 ? "s" : ""} enregistrée${clearCuts > 1 ? "s" : ""}.`
				].join(" ")
			)
		} finally {
			setProgress(undefined)
			controller.current = undefined
		}
	}

	const download = async () => {
		const name =
			(await communeNear(view.center.lat, view.center.lng)) ??
			`Zone du ${new Date().toLocaleDateString("fr-FR")}`
		await run({ ...plan.zone, name })
	}

	const show = (zone: OfflineZone) => {
		const { south, west, north, east } = zone.bounds
		// At its first zoom, the zone fills the screen it was downloaded from;
		// fitting the bounds could zoom out to a level that was not downloaded
		map.setView([(south + north) / 2, (west + east) / 2], zone.minZoom)
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Zones hors ligne</DialogTitle>
					<DialogDescription>
						Téléchargez la zone affichée pour consulter la carte sans réseau,
						jusqu'au niveau de la rue.
					</DialogDescription>
				</DialogHeader>

				<section className="flex flex-col gap-3">
					<span className="text-sm">Plan IGN, et en option :</span>
					{OPTIONAL_SOURCES.map((source) => (
						<div key={source} className="flex items-center gap-2 text-sm">
							<Switch
								id={`offline-source-${source}`}
								checked={options.includes(source)}
								disabled={downloading}
								onCheckedChange={(checked) =>
									setOptions((current) =>
										checked
											? [...current, source]
											: current.filter((s) => s !== source)
									)
								}
							/>
							<label htmlFor={`offline-source-${source}`}>
								{OFFLINE_SOURCES[source].label}
							</label>
						</div>
					))}
					{plan.tooLarge ? (
						<p className="text-sm text-red-700">
							Zone trop grande ({plan.zone.tileCount} tuiles, maximum{" "}
							{MAX_ZONE_TILES}) : zoomez davantage.
						</p>
					) : (
						<p className="text-sm text-zinc-600">
							{plan.zone.tileCount} tuiles, environ{" "}
							{megabytes(plan.estimatedBytes)}.
						</p>
					)}
					{downloading ? (
						<div className="flex flex-col gap-2">
							<Progress
								value={(100 * progress.done) / Math.max(progress.total, 1)}
							/>
							<div className="flex items-center justify-between text-sm">
								<span>
									{progress.done} / {progress.total} tuiles
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => controller.current?.abort()}
								>
									Annuler
								</Button>
							</div>
						</div>
					) : (
						<Button disabled={plan.tooLarge} onClick={download}>
							<Download className="size-4" />
							Télécharger cette zone
						</Button>
					)}
					{message && <output className="text-sm">{message}</output>}
					{isIosBrowser() && (
						<p className="text-sm text-amber-800">
							Sur iPhone, installez l'application sur l'écran d'accueil : sinon,
							Safari efface les zones après 7 jours sans visite.
						</p>
					)}
				</section>

				{zones.length > 0 && (
					<section className="flex flex-col gap-2">
						<h3 className="text-sm font-semibold">Zones téléchargées</h3>
						<ul className="flex flex-col divide-y">
							{zones.map((zone) => (
								<li
									key={zone.id}
									className="flex items-center justify-between gap-2 py-2"
								>
									<div className="flex flex-col text-sm">
										<span className="font-medium">{zone.name}</span>
										<span className="text-zinc-600">
											{new Date(zone.createdAt).toLocaleDateString("fr-FR")} ·{" "}
											{megabytes(zone.storedBytes)} ·{" "}
											{zone.sources
												.map((source) => OFFLINE_SOURCES[source].label)
												.join(", ")}
											{zone.clearCuts !== undefined &&
												` · ${zone.clearCuts} coupe${zone.clearCuts > 1 ? "s" : ""}`}
										</span>
										{!zone.complete && (
											<span className="text-amber-800">
												Incomplète : {zone.storedTiles} / {zone.tileCount}{" "}
												tuiles
											</span>
										)}
										{zone.clearCuts === undefined && (
											<span className="text-amber-800">
												Coupes de la zone non enregistrées
											</span>
										)}
									</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											title="Voir sur la carte"
											aria-label={`Voir ${zone.name} sur la carte`}
											onClick={() => show(zone)}
										>
											<Eye className="size-4" />
										</Button>
										{(!zone.complete || zone.clearCuts === undefined) && (
											<Button
												variant="ghost"
												size="icon"
												title="Reprendre"
												aria-label={`Reprendre ${zone.name}`}
												disabled={downloading}
												onClick={() => run(zone)}
											>
												<RotateCw className="size-4" />
											</Button>
										)}
										<Button
											variant="ghost"
											size="icon"
											title="Supprimer"
											aria-label={`Supprimer ${zone.name}`}
											disabled={downloading}
											onClick={() => deleteOfflineZone(zone.id)}
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								</li>
							))}
						</ul>
					</section>
				)}
			</DialogContent>
		</Dialog>
	)
}
