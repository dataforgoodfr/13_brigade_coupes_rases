import { useEffect, useState } from "react";

interface GeolocationResult {
	browserLocation?: GeolocationPosition;
	error?: GeolocationPositionError;
}
export function useGeolocation() {
	const [result, setResult] = useState<GeolocationResult>({});
	useEffect(() => {
		const id = navigator.geolocation.watchPosition(
			(location) => {
				console.log({ location });
				setResult({ browserLocation: location });
			},
			(error) => setResult({ browserLocation: undefined, error }),
		);
		return () => navigator.geolocation.clearWatch(id);
	}, []);
	return result;
}
