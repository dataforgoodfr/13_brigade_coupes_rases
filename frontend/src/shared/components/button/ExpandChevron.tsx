import { ChevronDown, ChevronUp } from "lucide-react"

interface Props {
	open: boolean
}
export function ExpandChevron({ open }: Props) {
	return open ? (
		<ChevronUp className="opacity-50 text-zinc" />
	) : (
		<ChevronDown className="opacity-50 text-zinc" />
	)
}
