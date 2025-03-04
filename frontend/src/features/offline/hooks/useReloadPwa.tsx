import { useRegisterSW } from "virtual:pwa-register/react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function useReloadPwa() {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r) {
			// biome-ignore lint/suspicious/noConsoleLog: <explanation>
			console.log(`SW Registered: ${r}`);
		},
		onRegisterError(error) {
			// biome-ignore lint/suspicious/noConsoleLog: <explanation>
			console.log("SW registration error", error);
		},
	});
	const { toast } = useToast();
	useEffect(() => {
		if (offlineReady) {
			toast({
				title: "L'application est prête",
				description: "Utilisation en mode déconnecté disponible",
			});
		} else if (needRefresh) {
			toast({
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
