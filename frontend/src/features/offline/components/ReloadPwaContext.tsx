import { useRegisterSW } from "virtual:pwa-register/react";

export function ReloadPrompt() {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r) {
			// biome-ignore lint/suspicious/noConsoleLog: PWA dev purpose
			console.log(`SW Registered: ${r}`);
		},
		onRegisterError(error) {
			// biome-ignore lint/suspicious/noConsoleLog: PWA dev purpose
			console.log("SW registration error", error);
		},
	});

	const close = () => {
		setOfflineReady(false);
		setNeedRefresh(false);
	};
	return (
		<div className="ReloadPrompt-container">
			{(offlineReady || needRefresh) && (
				<div className="ReloadPrompt-toast">
					<div className="ReloadPrompt-message">
						{offlineReady ? (
							<span>App ready to work offline</span>
						) : (
							<span>
								New content available, click on reload button to update.
							</span>
						)}
					</div>
					{needRefresh && (
						<button
							type="button"
							className="ReloadPrompt-toast-button"
							onClick={() => updateServiceWorker(true)}
						>
							Reload
						</button>
					)}
					<button
						type="button"
						className="ReloadPrompt-toast-button"
						onClick={() => close()}
					>
						Close
					</button>
				</div>
			)}
		</div>
	);
}
