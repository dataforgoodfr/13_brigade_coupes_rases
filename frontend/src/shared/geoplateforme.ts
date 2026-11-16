/** A WMTS layer of the IGN Géoplateforme: open licence, no key needed. */
export const geoplateformeUrl = (
	layer: string,
	format: "image/png" | "image/jpeg"
) =>
	`https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=${format}`

export const IGN_ATTRIBUTION =
	'&copy; <a href="https://geoservices.ign.fr/">IGN</a> - Géoplateforme'

export const PLAN_IGN_URL = geoplateformeUrl(
	"GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
	"image/png"
)
export const PHOTOS_IGN_URL = geoplateformeUrl(
	"ORTHOIMAGERY.ORTHOPHOTOS",
	"image/jpeg"
)
export const CADASTRE_URL = geoplateformeUrl(
	"CADASTRALPARCELS.PARCELLAIRE_EXPRESS",
	"image/png"
)

/** URL of one tile, as Leaflet builds it from the template. */
export const tileUrl = (
	template: string,
	{ x, y, z }: { x: number; y: number; z: number }
) =>
	template
		.replace("{z}", String(z))
		.replace("{x}", String(x))
		.replace("{y}", String(y))

/** Name of the commune nearest to the point, if the geocoder answers. */
export async function communeNear(
	lat: number,
	lng: number
): Promise<string | undefined> {
	try {
		const response = await fetch(
			`https://data.geopf.fr/geocodage/reverse?lon=${lng}&lat=${lat}&index=poi&category=commune&limit=1`
		)
		const data = (await response.json()) as {
			features?: { properties?: { toponym?: string } }[]
		}
		return data.features?.[0]?.properties?.toponym
	} catch {
		return undefined
	}
}
