import L from "leaflet"
import { Loader2, LocateFixed } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useMap } from "react-leaflet"

import { buttonVariants } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

/**
 * Single geolocation control. One tap locates + recenters the map and starts
 * live tracking; tapping again stops tracking. Rendered inline inside the map
 * control row (not absolutely positioned) so it never overlaps other controls.
 */
export function LocationButton({ className }: { className?: string }) {
	const map = useMap()
	const { toast } = useToast()
	const buttonRef = useRef<HTMLButtonElement>(null)
	const layerRef = useRef<L.LayerGroup | null>(null)
	const watchIdRef = useRef<number | null>(null)
	const [isLocating, setIsLocating] = useState(false)
	const [isTracking, setIsTracking] = useState(false)

	// Prevent button clicks/scrolls from bubbling into map drag/zoom handlers.
	useEffect(() => {
		if (!buttonRef.current) return
		L.DomEvent.disableClickPropagation(buttonRef.current)
		L.DomEvent.disableScrollPropagation(buttonRef.current)
	}, [])

	useEffect(() => {
		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current)
			}
			layerRef.current?.remove()
		}
	}, [])

	const updateMarker = (lat: number, lng: number, accuracy: number) => {
		if (!layerRef.current) {
			layerRef.current = L.layerGroup().addTo(map)
		} else {
			layerRef.current.clearLayers()
		}
		L.circle([lat, lng], {
			radius: accuracy,
			color: "#1d4ed8",
			fillColor: "#3b82f6",
			fillOpacity: 0.15,
			weight: 1,
			interactive: false
		}).addTo(layerRef.current)
		L.circleMarker([lat, lng], {
			radius: 8,
			color: "#ffffff",
			weight: 3,
			fillColor: "#1d4ed8",
			fillOpacity: 1,
			interactive: false
		}).addTo(layerRef.current)
	}

	const stopTracking = () => {
		if (watchIdRef.current !== null) {
			navigator.geolocation.clearWatch(watchIdRef.current)
			watchIdRef.current = null
		}
		layerRef.current?.remove()
		layerRef.current = null
		setIsTracking(false)
	}

	const handleClick = () => {
		if (!navigator.geolocation) {
			toast({
				title: "Géolocalisation non supportée",
				description: "Votre navigateur ne supporte pas la géolocalisation.",
				variant: "destructive"
			})
			return
		}

		if (isTracking) {
			stopTracking()
			return
		}

		setIsLocating(true)
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude, accuracy } = pos.coords
				updateMarker(latitude, longitude, accuracy)
				map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
					duration: 1
				})
				setIsLocating(false)
				setIsTracking(true)
				watchIdRef.current = navigator.geolocation.watchPosition(
					(p) =>
						updateMarker(
							p.coords.latitude,
							p.coords.longitude,
							p.coords.accuracy
						),
					() => {},
					{ enableHighAccuracy: true, maximumAge: 5000 }
				)
			},
			(err) => {
				setIsLocating(false)
				let description = "Impossible de récupérer votre position."
				if (err.code === err.PERMISSION_DENIED) {
					description =
						"Autorisez l'accès à votre position dans les paramètres de votre navigateur, puis réessayez."
				} else if (err.code === err.POSITION_UNAVAILABLE) {
					description = "Votre position n'est pas disponible actuellement."
				} else if (err.code === err.TIMEOUT) {
					description = "La recherche de votre position a pris trop de temps."
				}
				toast({
					title: "Géolocalisation impossible",
					description,
					variant: "destructive"
				})
			},
			{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
		)
	}

	return (
		<button
			ref={buttonRef}
			type="button"
			onClick={handleClick}
			disabled={isLocating}
			aria-label={isTracking ? "Désactiver ma position" : "Me localiser"}
			title={isTracking ? "Désactiver le suivi de position" : "Me localiser"}
			className={cn(
				buttonVariants({ variant: isTracking ? "default" : "white" }),
				"shrink-0 active:scale-95 disabled:cursor-wait",
				className
			)}
		>
			{isLocating ? (
				<Loader2 className="animate-spin" size={20} />
			) : (
				<LocateFixed size={20} />
			)}
			<span className="hidden sm:inline">
				{isTracking ? "Position active" : "Me localiser"}
			</span>
		</button>
	)
}
