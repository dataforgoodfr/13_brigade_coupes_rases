import {
	RuleLayout,
	type RuleLayoutProps
} from "@/features/admin/components/rules/RuleLayout"
import type { VariableRuleResponse } from "@/features/admin/store/rules"
import { Input } from "@/shared/components/input/Input"

type Props = VariableRuleResponse &
	RuleLayoutProps & {
		onThresholdUpdated: (value: number) => void
		value?: number
	}

export function VariableRule({
	onThresholdUpdated,
	value,
	inputId,
	...props
}: Props) {
	return (
		<RuleLayout inputId={inputId} {...props}>
			<Input
				type="number"
				value={value}
				id={inputId}
				onChange={(e) => onThresholdUpdated(e.target.valueAsNumber)}
			/>
		</RuleLayout>
	)
}
