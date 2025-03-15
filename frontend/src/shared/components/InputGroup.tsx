import type { ReactNode } from "react";

interface Props {
	label: string;
	htmlFor: string;
	children: ReactNode;
}
export function InputGroup({ children, htmlFor, label }: Props) {
	return (
		<div>
			<label
				htmlFor={htmlFor}
				className="block text-sm/6 font-medium text-gray-900"
			>
				{label}
			</label>
			<div className="mt-2">{children}</div>
		</div>
	);
}
