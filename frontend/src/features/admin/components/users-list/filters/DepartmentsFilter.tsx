import { Button } from "@/components/ui/button";
import { selectDepartments } from "@/features/admin/store/departments";
import type { Department } from "@/features/admin/store/departments-schemas";
import {
	selectFiltersDepartments,
	toggleDepartment,
} from "@/features/admin/store/users-filters.slice";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/components/dropdown/DropdownMenu";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";

export const RegionFilter: React.FC = () => {
	const dispatch = useAppDispatch();

	const departments = useAppSelector(selectDepartments);

	const departmentsFilter = useAppSelector(selectFiltersDepartments);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Selectionner des départements</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56 h-96 overflow-y-auto">
				<DropdownMenuLabel>Départements</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{departments.map((department: Department) => {
					return (
						<DropdownMenuCheckboxItem
							key={department.code}
							checked={departmentsFilter.some((dpt) => dpt === department.id)}
							onCheckedChange={() => {
								dispatch(toggleDepartment(department.id));
							}}
						>
							{department.name}
						</DropdownMenuCheckboxItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
