import type * as L from "leaflet"
import { CircleMarker, Tooltip, useMap } from "react-leaflet"

import {
	type CountedPoint,
	DISPLAY_PREVIEW_ZOOM_LEVEL
} from "@/features/clear-cut/store/clear-cuts"

// Large enough for the count and for a finger
const CLUSTER_MIN_RADIUS = 14

function getPointRadius(count: number, mapSize: L.Point) {
	const size = Math.min(mapSize.x, mapSize.y)
	const radius = (count / size) * 10
	return Math.max(radius, count > 1 ? CLUSTER_MIN_RADIUS : 3)
}

/** A cut, or a cluster of cuts with their count, zoomed on when tapped. */
export function CountedPointMarker({
	countedPoint: { count, point, bounds }
}: {
	countedPoint: CountedPoint
}) {
	const map = useMap()
	const [lng, lat] = point.coordinates

	// A cluster's cuts spread around its centroid: show them all
	const zoomIn = () => {
		if (count > 1 && bounds) {
			const [west, south, east, north] = bounds
			map.fitBounds(
				[
					[south, west],
					[north, east]
				],
				{ padding: [40, 40], maxZoom: DISPLAY_PREVIEW_ZOOM_LEVEL + 1 }
			)
		} else {
			map.setView(
				{ lat, lng },
				count > 1 ? map.getZoom() + 2 : DISPLAY_PREVIEW_ZOOM_LEVEL + 1
			)
		}
	}

	return (
		<CircleMarker
			color="#ff6467"
			center={{ lat, lng }}
			radius={getPointRadius(count, map.getSize())}
			fillOpacity={0.7}
			eventHandlers={{ click: zoomIn }}
		>
			{count > 1 && (
				<Tooltip
					permanent
					direction="center"
					className="bg-transparent! border-0! shadow-none! p-0! text-sm font-semibold text-white! before:hidden!"
				>
					{count}
				</Tooltip>
			)}
		</CircleMarker>
	)
}
