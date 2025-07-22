import { RulesPage } from "@/features/admin/components/rules/RulesPage";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_administration/rules")({
	component: RouteComponent,
});

function RouteComponent() {
	return <RulesPage />;
}
