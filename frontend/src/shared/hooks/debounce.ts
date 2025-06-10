import { debounce } from "lodash-es";
import { useCallback, useEffect, useState } from "react";

export function useDebounce<T>(
	value: T,
	handler: (val: T) => void,
	delay = 500,
): [T, (val: T) => void] {
	const [localValue, setLocalValue] = useState(value);
	useEffect(() => {
		setLocalValue(value);
	}, [value]);
	const debouncedHandler = useCallback(debounce(handler, delay), []);
	const onChange = useCallback(
		(newValue: T) => {
			setLocalValue(newValue);
			debouncedHandler(newValue);
		},
		[debouncedHandler],
	);
	return [localValue, onChange];
}
