import { useNavigate, useRouter } from "@tanstack/react-router"

import { meSlice } from "@/features/user/store/me.slice"
import { useAppDispatch } from "@/shared/hooks/store"

export const useLogout = () => {
	const router = useRouter()
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	return () => {
		dispatch(meSlice.actions.logoutUser())
		router.invalidate().finally(() => {
			navigate({ to: "/" })
		})
	}
}
