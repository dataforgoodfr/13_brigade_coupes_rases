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
import type { Users } from "@/features/admin/store/users-schemas";
import { selectUsers, useGetUsers } from "@/features/admin/store/users.slice";
import SortingButton from "@/shared/components/button/SortingButton";
import { useAppSelector } from "@/shared/hooks/store";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";

const columnHelper = createColumnHelper<Users>();

const columns = [
	columnHelper.accessor("login", {
		id: "login",
		header: ({ column }) => (
			<SortingButton
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Login
			</SortingButton>
		),
		sortingFn: "alphanumeric",
		enableSorting: true,
	}),
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
						<Badge key={department}>{department}</Badge>
					))}
				</span>
			);
		},
	}),
];

export const UsersList: React.FC = () => {
	useGetUsers();
	const users = useAppSelector(selectUsers);

	const table = useReactTable({
		data: users,
		columns,
		getCoreRowModel: getCoreRowModel(),
		// TODO: Implement sorting backend
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
		</div>
	);
};
