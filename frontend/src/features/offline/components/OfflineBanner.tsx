import { WifiOff } from "lucide-react"

import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus"

/**
 * Thin banner shown on every page while the browser reports no network, so
 * the volunteer knows why data may be stale and that sending has to wait.
 */
export function OfflineBanner() {
	const isOnline = useOnlineStatus()
	if (isOnline) return null
	return (
		<output className="flex items-center justify-center gap-2 bg-amber-100 text-amber-900 text-sm px-4 py-1.5">
			<WifiOff className="size-4 shrink-0" />
			<span>
				Hors connexion — données non actualisées, envoi possible au retour du
				réseau.
			</span>
		</output>
	)
}
