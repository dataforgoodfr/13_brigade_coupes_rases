import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

export function useNavigateToClearCut(clearCutId: string) {
	const navigate = useNavigate();
	return useCallback(() => {
		navigate({
			to: "/clear-cuts/$clearCutId",
			params: { clearCutId },
		});
	}, [navigate, clearCutId]);
}
