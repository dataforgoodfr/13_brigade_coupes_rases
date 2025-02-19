import {
	selectCutYears,
	toggleCutYear,
} from "@/features/clear-cutting/store/filters.slice";
import { ButtonGroup } from "@/shared/components/ButtonGroup";
import { InputGroup } from "@/shared/components/InputGroup";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";

const getCutYearLabel = (year: number) => year.toString();
export function Filters() {
	const cutYears = useAppSelector(selectCutYears);
	const dispatch = useAppDispatch();
	return (
		<InputGroup htmlFor="cutYears" label="Année de coupe">
			<ButtonGroup
				id="cutYears"
				items={cutYears}
				getLabel={getCutYearLabel}
				onClick={(year) => dispatch(toggleCutYear(year))}
			/>
		</InputGroup>
	);
}
