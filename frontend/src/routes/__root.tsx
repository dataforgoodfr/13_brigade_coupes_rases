import { Toaster } from "@/components/ui/toaster";
import { useReloadPwa } from "@/features/offline/hooks/useReloadPwa";
import type { AuthContext } from "@/features/user/components/Auth.context";
import { AppLayout } from "@/shared/components/AppLayout";
import { TimeProgress } from "@/shared/components/TimeProgress";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	getReferentialThunk,
	selectReferentialStatus,
} from "@/shared/store/referential/referential.slice";
import { Navigate, createRootRouteWithContext } from "@tanstack/react-router";
import { useEffect } from "react";

interface RouterContext {
	auth?: AuthContext;
}
export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	notFoundComponent: () => <Navigate to="/" />,
});

function RootComponent() {
	useReloadPwa();
	const dispatch = useAppDispatch();
	useEffect(() => {
		dispatch(getReferentialThunk());
	}, [dispatch]);
	const referentialStatus = useAppSelector(selectReferentialStatus);

	return referentialStatus === "success" ? (
		<>
			<AppLayout />
			<Toaster />
		</>
	) : (
		<div className="h-screen  justify-center flex  items-center">
			<TimeProgress className="w-1/4" durationMs={2000} />
		</div>
	);
}
