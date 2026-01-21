import { convert } from "geo-coordinates-parser"
import { Building2, MapPin, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

import { Input } from "./Input"
import { Loading } from "../Loading"

type Feature = {
	properties: {
		label: string
		name: string
		postcode?: string
		city?: string
		type: "housenumber" | "street" | "locality" | "municipality"
	}
	geometry: {
		coordinates: [number, number]
	}
}

type Props = {
	value?: string
	onSelect?: (coordinates: [number, number]) => void
	placeholder?: string
}

export function AddressInput({
	value = "",
	onSelect,
	placeholder = "Rechercher une adresse..."
}: Props) {
	const [query, setQuery] = useState(value)
	const [open, setOpen] = useState(false)
	const [results, setResults] = useState<Feature[]>([])
	const [loading, setLoading] = useState(false)
	const [customCoordinate, setCustomCoordinate] = useState<
		[number, number] | null
	>(null)
	const abortRef = useRef<AbortController | null>(null)

	useEffect(() => {
		if (!query || query.length < 3) {
			setResults([])
			setLoading(false)
			return
		}

		setLoading(true)
		const controller = new AbortController()
		abortRef.current?.abort()
		abortRef.current = controller

		const timeout = setTimeout(async () => {
			// Check for coordinate input
			try {
				const parsed = convert(query)
				if (parsed?.decimalLatitude && parsed.decimalLongitude) {
					setCustomCoordinate([parsed.decimalLongitude, parsed.decimalLatitude])
				} else {
					setCustomCoordinate(null)
				}
			} catch {
				setCustomCoordinate(null)
			}

			try {
				const res = await fetch(
					`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(
						query
					)}&limit=5`,
					{ signal: controller.signal }
				)

				const data = await res.json()
				setResults(data.features || [])
			} catch (e) {
				if ((e as Error).name !== "AbortError") {
					console.error(e)
				}
			} finally {
				setLoading(false)
			}
		}, 300)

		return () => clearTimeout(timeout)
	}, [query])

	return (
		<Popover open={open && query.length >= 3}>
			<PopoverAnchor asChild>
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => setOpen(true)}
					onBlur={() => setOpen(false)}
					placeholder={placeholder}
					className="w-full bg-white"
					suffix={
						query ? (
							<XIcon
								className="cursor-pointer pl-1"
								onClick={() => setQuery("")}
							/>
						) : null
					}
					suffixClassName="pr-1"
				/>
			</PopoverAnchor>

			<PopoverContent
				sideOffset={2}
				onOpenAutoFocus={(event) => event.preventDefault()}
				className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-white shadow-md overflow-hidden p-0"
			>
				{!loading && <div className="h-0.5 top-0" />}
				{loading && <Loading className="h-0.5 top-0" />}
				{results.length === 0 && !loading && !customCoordinate && (
					<div className="px-3 py-2 text-sm text-gray-500">Pas de résultat</div>
				)}

				{results.map((feature) => (
					<button
						key={feature.properties.label}
						type="button"
						onMouseDown={(e) => {
							e.preventDefault()
							onSelect?.(feature.geometry.coordinates)
							setQuery(feature.properties.label)
							setOpen(false)
						}}
						className="flex w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
					>
						{["housenumber", "street", "locality"].includes(
							feature.properties.type
						) && (
							<MapPin
								className="inline-block mr-1.5"
								size={20}
								strokeWidth={1.5}
							/>
						)}
						{feature.properties.type === "municipality" && (
							<Building2
								className="inline-block mr-1.5"
								size={20}
								strokeWidth={1.5}
							/>
						)}

						{feature.properties.label}
					</button>
				))}
				{customCoordinate && (
					<button
						type="button"
						onMouseDown={(e) => {
							e.preventDefault()
							onSelect?.(customCoordinate)
							setQuery(`${customCoordinate[1]}, ${customCoordinate[0]}`)
							setOpen(false)
						}}
						className="flex w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
					>
						<MapPin
							className="inline-block mr-1.5"
							size={20}
							strokeWidth={1.5}
						/>
						{customCoordinate[1].toFixed(6)}, {customCoordinate[0].toFixed(6)}
					</button>
				)}
			</PopoverContent>
		</Popover>
	)
}
