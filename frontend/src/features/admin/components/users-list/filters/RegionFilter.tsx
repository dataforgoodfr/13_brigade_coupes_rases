import { Button } from "@/components/ui/button";
import {
	selectDepartments,
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
import { useEffect, useState } from "react";

export const RegionFilter: React.FC = () => {
	const dispatch = useAppDispatch();
	const departmentsFilter = useAppSelector(selectDepartments);

	const [regions, setRegions] = useState([]);

	useEffect(() => {
		// Fetch regions TODO: mock ?
		fetch("https://geo.api.gouv.fr/regions")
			.then((response) => response.json())
			.then((data) => {
				setRegions(data);
			})
			.catch((error) => {
				console.error("Error:", error);
			});
	}, []);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Selectionner des régions</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56 h-96 overflow-y-auto">
				<DropdownMenuLabel>Régions</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{regions.map(
					(region: {
						code: string;
						nom: string;
					}) => {
						return (
							<DropdownMenuCheckboxItem
								key={region.code}
								checked={departmentsFilter.some(
									(department) => department === region.nom,
								)}
								onCheckedChange={() => {
									dispatch(toggleDepartment(region.nom));
								}}
							>
								{region.nom}
							</DropdownMenuCheckboxItem>
						);
					},
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
