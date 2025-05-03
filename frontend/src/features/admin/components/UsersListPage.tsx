import { Filters } from "@/features/admin/components/users-list/Filters";
import { UsersList } from "@/features/admin/components/users-list/UsersList";
import { useGetDepartments } from "@/features/admin/store/departments";

export const UsersListPage: React.FC = () => {
	useGetDepartments();

	return (
		<div className="flex flex-col gap-8 p-4">
			<h1 className="text-2xl font-bold">Liste des utilisateurs</h1>
			<Filters />

			<div className="h-1/3">
				<UsersList />
			</div>
		</div>
	);
};
