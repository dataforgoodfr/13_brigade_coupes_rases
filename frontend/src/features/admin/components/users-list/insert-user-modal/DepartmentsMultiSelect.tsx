import MultipleSelector from "@/components/ui/multiple-select";
import { selectDepartments } from "@/features/admin/store/departments";
import { useAppSelector } from "@/shared/hooks/store";
import { type ComponentPropsWithoutRef, useMemo } from "react";

type DepartmentsMultiSelectProps = ComponentPropsWithoutRef<
	typeof MultipleSelector
>;

const DepartmentsMultiSelect: React.FC<DepartmentsMultiSelectProps> = (
	registerProps,
) => {
	const departments = useAppSelector(selectDepartments);

	const formattedDepartments = useMemo(() => {
		return departments.map((department) => ({
			label: department.name,
			value: department.id,
		}));
	}, [departments]);

	return (
		<MultipleSelector
			defaultOptions={formattedDepartments}
			placeholder="Rechercher un département"
			emptyIndicator={
				<p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
					pas de résultats trouvés.
				</p>
			}
			{...registerProps}
		/>
	);
};

export default DepartmentsMultiSelect;
