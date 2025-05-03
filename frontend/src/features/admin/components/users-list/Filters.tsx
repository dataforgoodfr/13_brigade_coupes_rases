import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import AddUserButton from "@/features/admin/components/users-list/filters/AddUserButton";
import { RegionFilter } from "@/features/admin/components/users-list/filters/DepartmentsFilter";
import {
	selectName,
	selectRole,
	setName,
	setRole,
} from "@/features/admin/store/users-filters.slice";
import { ROLES, type Role } from "@/features/user/store/user";
import { Input } from "@/shared/components/input/Input";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { debounce } from "lodash-es";
import { Search } from "lucide-react";
import { useState } from "react";

export const Filters: React.FC = () => {
	const dispatch = useAppDispatch();
	const searchedName = useAppSelector(selectName);
	const role = useAppSelector(selectRole);

	const [search, setSearch] = useState(searchedName);

	const handleSearch = debounce((name) => {
		dispatch(setName(name));
	}, 500);

	const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;

		setSearch(name);
		handleSearch(name);
	};

	return (
		<div className="flex flex-row justify-between gap-4">
			<div className="flex items-center w-full gap-4">
				<Input
					type="search"
					placeholder="Rechercher un utilisateur..."
					value={search}
					onChange={onSearch}
					prefix={<Search className="w-5 h-5 ml-4 stroke-zinc-600" />}
					className="pl-12 w-sm text-zinc-600"
				/>

				<Select
					value={role}
					onValueChange={(value) => dispatch(setRole(value as Role))}
				>
					<SelectTrigger className="max-w-3xs">
						<SelectValue placeholder="Sélectionner un rôle" />
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="all">Tous</SelectItem>

						{ROLES.map((role) => {
							return (
								<SelectItem key={role} value={role}>
									{role}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>

				<RegionFilter />
			</div>
			<AddUserButton />
		</div>
	);
};
