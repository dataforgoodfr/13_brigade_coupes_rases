import type { VariableRuleResponse } from "@/features/admin/store/rules";

type Props = VariableRuleResponse;
export function VariableRule({ type }: Props) {
	return <>{type}</>;
}
