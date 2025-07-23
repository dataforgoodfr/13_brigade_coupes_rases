import { Filters } from "@/features/admin/components/users-list/Filters";
import { UsersList } from "@/features/admin/components/users-list/UsersList";
import { useGetUsers } from "@/features/admin/store/users.slice";

export const UsersListPage: React.FC = () => {
	useGetUsers();

	return (
		<div className="flex flex-col gap-8 p-4">
			<h1 className="text-2xl font-bold">Liste des utilisateurs</h1>
			<Filters />
			<UsersList />
		</div>
	);
};
