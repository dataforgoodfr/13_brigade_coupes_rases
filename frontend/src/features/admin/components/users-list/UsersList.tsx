import { Badge } from "@/components/ui/badge";
import {} from "@/components/ui/pagination";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { selectDepartments } from "@/features/admin/store/departments";
import type { Department } from "@/features/admin/store/departments-schemas";
import {
	selectPage,
	setPage,
} from "@/features/admin/store/users-filters.slice";
import {
	selectMetadata,
	selectUsers,
	useGetUsers,
} from "@/features/admin/store/users.slice";
import SortingButton from "@/shared/components/button/SortingButton";
import Pagination from "@/shared/components/pagination/Pagination";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import type { RootState } from "@/shared/store/store";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

const columnHelper = createColumnHelper<{
	firstname: string;
	lastname: string;
	email: string;
	role: string;
	departments: Department[];
}>();

const columns = [
	columnHelper.accessor("firstname", {
		id: "first_name",
		header: ({ column }) => (
			<SortingButton
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Prénom
			</SortingButton>
		),
		sortingFn: "alphanumeric",
		enableSorting: true,
	}),
	columnHelper.accessor("lastname", {
		id: "last_name",
		header: ({ column }) => (
			<SortingButton
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Nom
			</SortingButton>
		),
		sortingFn: "alphanumeric",
		enableSorting: true,
	}),
	columnHelper.accessor("email", {
		id: "email",
		header: ({ column }) => (
			<SortingButton
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Email
			</SortingButton>
		),
		sortingFn: "alphanumeric",
		enableSorting: true,
	}),
	columnHelper.accessor("role", {
		id: "role",
		header: ({ column }) => (
			<SortingButton
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Rôle
			</SortingButton>
		),
		sortingFn: "alphanumeric",
		enableSorting: true,
	}),
	columnHelper.accessor("departments", {
		id: "departments",
		header: () => <span>Départements</span>,
		cell: (info) => {
			const departments = info.getValue();

			if (!departments?.length) {
				return null;
			}

			return (
				<span className="flex flex-wrap gap-1">
					{departments.map((department) => (
						<Badge key={department.id}>{department.name}</Badge>
					))}
				</span>
			);
		},
	}),
];

export const UsersList: React.FC = () => {
	useGetUsers();
	const users = useAppSelector(selectUsers);
	const dispatch = useAppDispatch();

	const page = useAppSelector(selectPage);
	const metadata = useAppSelector(selectMetadata);

	const departments = useAppSelector(selectDepartments);

	const filters = useAppSelector((state: RootState) => state.usersFilters);

	const formattedUsers = useMemo(() => {
		return users.reduce((filteredUsers, user) => {
			let isValidUser = true;

			if (filters.name)
				isValidUser =
					(isValidUser &&
						// For testing purposes, basic filter users by name or email TODO: unaccent
						user.login
							.toLowerCase()
							.includes(filters.name.toLowerCase() || "")) ||
					user.email.toLowerCase().includes(filters.name.toLowerCase() || "");

			if (filters.role) isValidUser = isValidUser && user.role === filters.role;

			if (filters.departments?.length)
				isValidUser =
					isValidUser &&
					filters.departments.some((r) => user?.departments?.includes(r));


			if (isValidUser) {
				filteredUsers.push({
					...user,
					role: user.role ?? "",
					departments: user.departments.reduce(
						(filteredDpt: Department[], dpt) => {
							const department = departments.find((d) => d.id === dpt);

							if (department) {
								filteredDpt.push(department);
							}

							return filteredDpt;
						},
						[],
					),
				});
			}

			return filteredUsers;
		}, []);
	}, [departments, users, filters]);

	const table = useReactTable({
		data: formattedUsers,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<div className="flex flex-col gap-4">
			<Table className="w-full table-fixed">
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows.map((row) => {
						return (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => {
									return (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									);
								})}
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			<Pagination
				currentPage={page}
				setCurrentPage={(newPage) => {
					dispatch(setPage(newPage));
				}}
				pagesCount={metadata?.pagesCount ?? 0}
			/>
		</div>
	);
};
