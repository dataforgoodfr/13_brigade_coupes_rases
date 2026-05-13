import type { LatLngExpression, Map as LeafletMap } from "leaflet"
import { useEffect, useRef } from "react"
import { MapContainer, TileLayer } from "react-leaflet"

import { useLayout } from "@/features/clear-cut/components/Layout.context"
import { cn } from "@/lib/utils"

import "@geoman-io/leaflet-geoman-free"
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css"
import { useState } from "react"
import { useMap } from "react-leaflet"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useConnectedMe } from "@/features/user/store/me.slice"

import { getClearCutsThunk } from "@/features/clear-cut/store/clear-cuts-slice"
import { selectFiltersRequest } from "@/features/clear-cut/store/filters.slice"
import { api } from "@/shared/api/api"
import { getStoredToken } from "@/features/user/store/me.slice"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import { useNavigate } from "@tanstack/react-router"

import { ClearCuts } from "./ClearCuts"

function authedApi() {
	const token = getStoredToken() as any
	return token?.accessToken
		? api.extend({ headers: { Authorization: `Bearer ${token.accessToken}` } })
		: api
}

function GeomanControls() {
	const map = useMap()
	const { toast } = useToast()
	const user = useConnectedMe()
	const [isOpen, setIsOpen] = useState(false)
	const [_geometry, setGeometry] = useState<any>(null)
	const [citySearch, setCitySearch] = useState("")
	const [cityResults, setCityResults] = useState<{ insee_code: string; name: string; department_code: string }[]>([])
	const [selectedCity, setSelectedCity] = useState<{ insee_code: string; name: string; department_code: string } | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const dispatch = useAppDispatch()
	const filters = useAppSelector(selectFiltersRequest)
	const navigate = useNavigate()

	const isGeomanInitialized = useRef(false)

	// Initialize Geoman controls once — guard prevents duplicate toolbars on re-renders
	useEffect(() => {
		if (!map || !user) return
		if (isGeomanInitialized.current) return

		map.pm.addControls({
			position: "bottomright",
			drawMarker: false,
			drawCircleMarker: false,
			drawPolyline: false,
			drawRectangle: false,
			drawCircle: false,
			drawText: false,
			editMode: false,
			dragMode: false,
			cutPolygon: false,
			removalMode: false,
			drawPolygon: true
		})

		map.pm.setLang("fr")
		isGeomanInitialized.current = true
	}, [map, user])

	// Register pm:create listener separately so cleanup/re-registration works correctly
	// if map or user reference changes after initialization
	useEffect(() => {
		if (!map || !user) return

		const handleCreate = (e: any) => {
			const layer = e.layer
			const geojson = layer.toGeoJSON()
			setGeometry(geojson)
			setIsOpen(true)
			map.removeLayer(layer)
		}

		map.on("pm:create", handleCreate)

		return () => {
			map.off("pm:create", handleCreate)
		}
	}, [map, user])

	useEffect(() => {
		if (citySearch.length < 2) {
			setCityResults([])
			return
		}
		const timeout = setTimeout(async () => {
			try {
				const results = await authedApi()
					.get("api/v1/cities/search", { searchParams: { q: citySearch } })
					.json<{ insee_code: string; name: string; department_code: string }[]>()
				setCityResults(results)
			} catch {
				setCityResults([])
			}
		}, 250)
		return () => clearTimeout(timeout)
	}, [citySearch])

	const handleDialogClose = (open: boolean) => {
		if (!open) {
			setCitySearch("")
			setCityResults([])
			setSelectedCity(null)
			setGeometry(null)
		}
		setIsOpen(open)
	}

	const handleSubmit = async () => {
		if (!selectedCity) {
			toast({
				title: "Erreur",
				description: "Veuillez sélectionner une commune.",
				variant: "destructive"
			})
			return
		}
		setIsSubmitting(true)
		try {
			const response = await authedApi()
				.post("api/v1/clear-cuts-reports/volunteer-create", {
					json: {
						polygon: _geometry.geometry,
						city_zip_code: selectedCity.insee_code
					}
				})
				.json<{ id: string; message: string }>()

			toast({
				title: "Coupe rase signalée !",
				description: response.message,
				variant: "default"
			})
			handleDialogClose(false)
			if (filters) dispatch(getClearCutsThunk(filters))
			navigate({ to: "/clear-cuts/$clearCutId", params: { clearCutId: response.id } })
		} catch {
			toast({
				title: "Erreur",
				description: "Impossible de créer le signalement. Vérifiez que la géométrie est valide.",
				variant: "destructive"
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleDialogClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Signaler une coupe rase manuellement</DialogTitle>
					<DialogDescription>
						Recherchez la commune où se trouve la coupe rase tracée.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="citySearch">Commune</Label>
						<div className="relative">
							<input
								id="citySearch"
								placeholder="Ex: Limoges, Saint-Étienne..."
								value={selectedCity ? `${selectedCity.name} (${selectedCity.department_code})` : citySearch}
								onChange={(e: any) => {
									setSelectedCity(null)
									setCitySearch(e.target.value)
								}}
								autoComplete="off"
								className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							/>
							{cityResults.length > 0 && !selectedCity && (
								<ul className="absolute z-50 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-md max-h-48 overflow-y-auto">
									{cityResults.map((city: any) => (
										<li
											key={city.insee_code}
											className="cursor-pointer px-3 py-2 text-sm hover:bg-neutral-100"
											onMouseDown={(e: any) => {
												e.preventDefault()
												setSelectedCity(city)
												setCitySearch("")
												setCityResults([])
											}}
										>
											{city.name}
											<span className="ml-1 text-neutral-400 text-xs">({city.department_code})</span>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleDialogClose(false)}
						disabled={isSubmitting}
					>
						Annuler
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting || !selectedCity}>
						{isSubmitting ? "Envoi..." : "Valider le signalement"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

const FRANCE_CENTER: LatLngExpression = [46.695554, 2.440236]
const WHOLE_FRANCE_ZOOM = 6

export function InteractiveMap() {
	const mapRef = useRef<LeafletMap>(null)
	const { layout } = useLayout()

	useEffect(() => {
		if (layout) {
			mapRef.current?.invalidateSize()
		}
	}, [layout])

	// Hide map if in test environment
	if (import.meta.env.MODE === "test") {
		return null
	}

	return (
		<MapContainer
			ref={mapRef}
			className={cn("h-full w-full z-0", layout === "map" && "rounded-md")}
			center={FRANCE_CENTER}
			zoom={WHOLE_FRANCE_ZOOM}
			scrollWheelZoom
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<GeomanControls />
			<ClearCuts />
		</MapContainer>
	)
}
