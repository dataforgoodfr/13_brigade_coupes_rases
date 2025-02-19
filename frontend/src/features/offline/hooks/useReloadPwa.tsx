import { useRegisterSW } from "virtual:pwa-register/react";
import { ToastAction, ToastClose } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function useReloadPwa() {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r) {
			console.log(`SW Registered: ${r}`);
		},
		onRegisterError(error) {
			console.log("SW registration error", error);
		},
	});
	const { toast } = useToast();
	useEffect(() => {
		console.log({ offlineReady, needRefresh });
		if (offlineReady) {
			toast({
				title: "L'application est prête",
				description: "Utilisation en mode déconnecté disponible",
			});
		} else if (needRefresh) {
			toast({
				title: "Nouveau contenu disponible",
				description: "Cliquez sur Recharger l'application",
				action: (
					<>
						<ToastAction
							altText="Recharger l'application"
							onClick={() => updateServiceWorker(true)}
						>
							Recharger l'application
						</ToastAction>
						<ToastClose
							onClick={() => {
								setOfflineReady(false);
								setNeedRefresh(false);
							}}
						>
							CLOSE
						</ToastClose>
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
