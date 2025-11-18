import { SearchIcon } from "lucide-react";
import {
	selectFullTextSearch,
	usersFiltersSlice,
} from "@/features/admin/store/users-filters.slice";
import { Input } from "@/shared/components/input/Input";
import { useDebounce } from "@/shared/hooks/debounce";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";

export const Filters: React.FC = () => {
	const dispatch = useAppDispatch();
	const searchedName = useAppSelector(selectFullTextSearch);

	const [search, handleSearch] = useDebounce(searchedName, (n) =>
		dispatch(usersFiltersSlice.actions.setFullTextSearch(n)),
	);
	return (
		<div className="flex items-center w-full gap-4">
			<Input
				type="search"
				placeholder="Rechercher un utilisateur..."
				value={search}
				onChange={(e) => handleSearch(e.target.value)}
				prefix={<SearchIcon className="w-5 h-5 ml-4 stroke-zinc-600" />}
				className="pl-12 w-sm text-zinc-600"
			/>
		</div>
	);
};
