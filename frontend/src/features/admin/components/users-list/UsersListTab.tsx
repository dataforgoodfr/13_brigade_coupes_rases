import { CreateUserDialog } from "@/features/admin/components/users-list/CreateUserDialog";
import { Filters } from "@/features/admin/components/users-list/Filters";
import { Pagination } from "@/features/admin/components/users-list/Pagination";
import { UsersList } from "@/features/admin/components/users-list/UsersList";
import { useGetUsers } from "@/features/admin/store/users.slice";

export const UsersListTab: React.FC = () => {
	useGetUsers();

	return (
		<>
			<h1 className="text-2xl font-bold">Liste des utilisateurs</h1>
			<div className="flex justify-between">
				<Filters />
				<CreateUserDialog />
			</div>

			<div className="flex gap-4 grow  overflow-auto h-0">
				<UsersList />
			</div>
			<Pagination />
		</>
	);
};
