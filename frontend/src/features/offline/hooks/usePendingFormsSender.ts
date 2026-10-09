import { useEffect, useRef } from "react"

import { sendPendingFormsThunk } from "@/features/clear-cut/store/clear-cuts-slice"
import { onPendingFormsSendRequested } from "@/features/clear-cut/store/pendingForms"
import { useConnectedMe } from "@/features/user/store/me.slice"
import { useAppDispatch } from "@/shared/hooks/store"

/**
 * Sends the forms saved without network: at start-up, when the network comes
 * back, and when asked (offline photos just left). Mounted once in the app.
 */
export function usePendingFormsSender() {
	const dispatch = useAppDispatch()
	const isConnected = !!useConnectedMe()
	const runningRef = useRef<Promise<unknown> | undefined>(undefined)
	const againRef = useRef(false)

	useEffect(() => {
		if (!isConnected) return
		const send = () => {
			if (!navigator.onLine) return
			// One pass at a time; a request during a pass triggers another one
			if (runningRef.current) {
				againRef.current = true
				return
			}
			runningRef.current = dispatch(sendPendingFormsThunk()).finally(() => {
				runningRef.current = undefined
				if (againRef.current) {
					againRef.current = false
					send()
				}
			})
		}
		send()
		window.addEventListener("online", send)
		const unsubscribe = onPendingFormsSendRequested(send)
		return () => {
			window.removeEventListener("online", send)
			unsubscribe()
		}
	}, [dispatch, isConnected])
}
