import { cn } from "@/lib/utils";

export type FixedFieldProps = {
	title?: string;
	value?: string | number;
	className?: string;
};

export function FixedField({ title, value, className }: FixedFieldProps) {
	return (
		<div className={cn("flex gap-2", className)}>
			{title && <span className="font-bold">{title} :</span>}
			{value && <p>{value}</p>}
		</div>
	);
}
