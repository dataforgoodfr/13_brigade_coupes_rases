import { Button } from "@/components/ui/button";
import {
	type Region,
	selectRegions,
	toggleRegion,
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
	const regionsFilter = useAppSelector(selectRegions);

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
				{regions.map((region: Region) => {
					return (
						<DropdownMenuCheckboxItem
							key={region.code}
							checked={regionsFilter.some((r) => r.code === region.code)}
							onCheckedChange={() => {
								dispatch(toggleRegion(region));
							}}
						>
							{region.nom}
						</DropdownMenuCheckboxItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
