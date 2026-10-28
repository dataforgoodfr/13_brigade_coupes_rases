import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import type { RequestedContent } from "@/shared/api/types"
import { Loading } from "@/shared/components/Loading"
import { TimeProgress } from "@/shared/components/TimeProgress"

interface Props<T> {
	requested: RequestedContent<T>
	errorMessage: string
	onRetry: () => void
	children: ReactNode
}

/**
 * Part of a page that shows a fetched value, so the rest of the page
 * (title, filters) stays visible while it loads. A reload keeps the previous
 * value on screen under a thin progress bar instead of blanking it.
 */
export function RequestedSection<T>({
	requested,
	errorMessage,
	onRetry,
	children
}: Props<T>) {
	if (requested.status === "error") {
		return (
			<div className="flex flex-col items-center gap-4 py-12">
				<p>{errorMessage}</p>
				<Button onClick={onRetry}>Réessayer</Button>
			</div>
		)
	}
	if (requested.value === undefined) {
		return (
			<div className="flex justify-center py-12">
				<TimeProgress className="w-1/4" durationMs={1000} />
			</div>
		)
	}
	return (
		<div className="relative" aria-busy={requested.status === "loading"}>
			{requested.status === "loading" && (
				<Loading className="absolute -top-2 left-0" />
			)}
			{children}
		</div>
	)
}
