import {
	selectDepartments,
	selectName,
	selectRoles,
	usersFiltersSlice,
} from "@/features/admin/store/users-filters.slice";
import { Input } from "@/shared/components/input/Input";
import { ComboboxFilter } from "@/shared/components/select/ComboboxFilter";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	namedIdTranslator,
	selectableItemToString,
	useEnhancedItems,
} from "@/shared/items";
import { debounce } from "lodash-es";
import { Search } from "lucide-react";
import { useState } from "react";
const DEPARTMENTS = {
	id: "departments",
	label: "Départements",
};
const ROLES = {
	id: "roles",
	label: "Rôles",
};
export const Filters: React.FC = () => {
	const dispatch = useAppDispatch();
	const searchedName = useAppSelector(selectName);
	const roles = useEnhancedItems(
		useAppSelector(selectRoles),
		selectableItemToString,
		selectableItemToString,
	);
	const departments = useEnhancedItems(
		useAppSelector(selectDepartments),
		namedIdTranslator,
		namedIdTranslator,
	);
	const [search, setSearch] = useState(searchedName);

	const handleSearch = debounce((name) => {
		dispatch(usersFiltersSlice.actions.setName(name));
	}, 500);

	const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;

		setSearch(name);
		handleSearch(name);
	};

	return (
		<div className="flex items-center w-full gap-4">
			<Input
				type="search"
				placeholder="Rechercher un utilisateur..."
				value={search}
				onChange={onSearch}
				prefix={<Search className="w-5 h-5 ml-4 stroke-zinc-600" />}
				className="pl-12 w-sm text-zinc-600"
			/>
			<label htmlFor={ROLES.id}>{ROLES.label}</label>
			<ComboboxFilter
				type="multiple"
				countPreview
				hasInput
				hasReset
				label={ROLES.label}
				items={roles}
				changeOnClose={(roles) =>
					dispatch(usersFiltersSlice.actions.setRoles(roles))
				}
			/>

			<label htmlFor={DEPARTMENTS.id}>{DEPARTMENTS.label}</label>
			<ComboboxFilter
				type="multiple"
				countPreview
				hasInput
				hasReset
				label={DEPARTMENTS.label}
				items={departments}
				changeOnClose={(departments) =>
					dispatch(usersFiltersSlice.actions.setDepartments(departments))
				}
			/>
		</div>
	);
};
