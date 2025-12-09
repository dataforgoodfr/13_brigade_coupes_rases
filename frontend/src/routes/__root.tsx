import { createRootRouteWithContext, Navigate } from "@tanstack/react-router"
import { useEffect } from "react"

import { Toaster } from "@/components/ui/toaster"
import { MapProvider } from "@/features/clear-cut/components/map/Map.context"

const useReloadPwa: () => void = (
	await import(/* @vite-ignore */ import.meta.env.VITE_USE_RELOAD_PWA_PATH)
).useReloadPwa

import type { AuthContext } from "@/features/user/components/Auth.context"
import { AppLayout } from "@/shared/components/AppLayout"
import { AppMobileLayout } from "@/shared/components/AppMobileLayout"
import { TimeProgress } from "@/shared/components/TimeProgress"
import { useBreakpoint } from "@/shared/hooks/breakpoint"
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store"
import {
	getReferentialThunk,
	selectReferentialStatus
} from "@/shared/store/referential/referential.slice"

interface RouterContext {
	auth?: AuthContext
}
export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	notFoundComponent: () => <Navigate to="/" />
})

function RootComponent() {
	useReloadPwa()
	const dispatch = useAppDispatch()
	useEffect(() => {
		dispatch(getReferentialThunk())
	}, [dispatch])
	const referentialStatus = useAppSelector(selectReferentialStatus)
	const { breakpoint } = useBreakpoint()
	return referentialStatus === "success" ? (
		<>
			<MapProvider>
				{breakpoint === "all" ? <AppLayout /> : <AppMobileLayout />}
			</MapProvider>
			<Toaster />
		</>
	) : (
		<div className="h-screen  justify-center flex  items-center">
			<TimeProgress className="w-1/4" durationMs={2000} />
		</div>
	)
}
