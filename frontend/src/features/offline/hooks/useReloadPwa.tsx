import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export function useReloadPwa() {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r) {
			// biome-ignore lint/suspicious/noConsole: Debug purpose
			console.debug(`SW Registered: ${r}`);
		},
		onRegisterError(error) {
			// biome-ignore lint/suspicious/noConsole: Debug purpose
			console.debug("SW registration error", error);
		},
	});
	const { toast } = useToast();
	useEffect(() => {
		if (offlineReady) {
			toast({
				id: "app-ready",
				title: "L'application est prête",
				description: "Utilisation en mode déconnecté disponible",
			});
		} else if (needRefresh) {
			toast({
				id: "new-app-available",
				title: "Nouveau contenu disponible",
				description: "Cliquez sur Recharger l'application",
				onClose: () => {
					setOfflineReady(false);
					setNeedRefresh(false);
				},
				action: (
					<>
						<ToastAction
							altText="Recharger l'application"
							onClick={() => updateServiceWorker(true)}
						>
							Recharger l'application
						</ToastAction>
					</>
				),
			});
		}
	}, [
		offlineReady,
		needRefresh,
		updateServiceWorker,
		setNeedRefresh,
		setOfflineReady,
		toast,
	]);
}
