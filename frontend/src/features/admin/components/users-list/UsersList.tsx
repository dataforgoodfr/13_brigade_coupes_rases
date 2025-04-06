import { Badge } from "@/components/ui/badge";
import {} from "@/components/ui/pagination";
import {
	Table,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useGetFilteredUsersQuery } from "@/features/admin/store/api";
import { UserAvatar } from "@/features/user/components/UserAvatar";
import type { FullUser } from "@/features/user/store/user";

import SortingButton from "@/shared/components/button/SortingButton";
import Pagination from "@/shared/components/pagination/Pagination";
import {} from "@/shared/hooks/store";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

const columnHelper = createColumnHelper<FullUser>();

const columns = [
	columnHelper.accessor("avatarUrl", {
		id: "avatar",
		header: () => <span />,
		cell: (info) => {
			return (
				<UserAvatar
					url={info.getValue()}
					fallbackName={info.row.getValue("login")}
				/>
			);
		},
	}),
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
	columnHelper.accessor("affectedDepartments", {
		id: "departements",
		header: () => <span>Départements</span>,
		cell: (info) => {
			const departments: FullUser["affectedDepartments"] = info.getValue();

			if (
				!departments?.length ||
				info.row.getValue("role") === "administrator"
			) {
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
	const { data } = useGetFilteredUsersQuery();

	const usersList = useMemo(() => {
		return (data?.users) ?? [];
	}, [data]);

	const table = useReactTable({
		// @ts-ignore TODO: fix type
		data: usersList,
		columns,
		getCoreRowModel: getCoreRowModel(),
		// TODO: Implement sorting backend ?
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 8,
				pageIndex: 1,
			},
		},
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
				<TableHeader>
					{table.getRowModel().rows.map((row) => (
						<TableRow key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableHeader>
			</Table>

			<Pagination
				currentPage={table.getState().pagination.pageIndex}
				setCurrentPage={(newPage) => {
					table.setPageIndex(newPage);
				}}
				totalPages={table.getPageCount()}
			/>
		</div>
	);
};
