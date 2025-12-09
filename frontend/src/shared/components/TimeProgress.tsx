import { useEffect, useState } from "react"

import { Progress, type ProgressProps } from "@/components/ui/progress"

interface Props extends Omit<ProgressProps, "value"> {
	durationMs: number
	isFinished?: boolean
}
export function TimeProgress({
	isFinished = false,
	durationMs,
	...props
}: Props) {
	const [value, setValue] = useState(0)
	useEffect(() => {
		if (isFinished) {
			setValue(0)
		}
	}, [isFinished])

	useEffect(() => {
		const id = setInterval(() => setValue(value + 1), durationMs / 100)
		return () => clearInterval(id)
	}, [value, durationMs])
	useEffect(() => {
		const id = setTimeout(() => setValue(100), durationMs)
		return () => clearTimeout(id)
	}, [durationMs])
	return <Progress {...props} value={value} />
}
