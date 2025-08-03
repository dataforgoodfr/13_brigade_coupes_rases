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
import type { User } from "@/features/admin/store/users";
import {
	selectColumnSort,
	selectPage,
	usersFiltersSlice,
} from "@/features/admin/store/users-filters.slice";
import {
	selectMetadata,
	selectUsers,
} from "@/features/admin/store/users.slice";
import Pagination from "@/shared/components/Pagination";
import { SortingButton } from "@/shared/components/button/SortingButton";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";

const columnHelper = createColumnHelper<User>();

export const UsersList: React.FC = () => {
	const users = useAppSelector(selectUsers);
	const metadata = useAppSelector(selectMetadata);
	const dispatch = useAppDispatch();
	const page = useAppSelector(selectPage);
	const firstnameSort = useAppSelector(selectColumnSort("firstname"));
	const lastnameSort = useAppSelector(selectColumnSort("lastname"));
	const emailSort = useAppSelector(selectColumnSort("email"));
	const loginSort = useAppSelector(selectColumnSort("login"));
	const roleSort = useAppSelector(selectColumnSort("role"));

	const columns = [
		columnHelper.accessor("firstname", {
			id: "firstname",
			header: () => (
				<SortingButton
					sort={firstnameSort}
					onClick={() =>
						dispatch(usersFiltersSlice.actions.toggleSort("firstname"))
					}
				>
					Prénom
				</SortingButton>
			),
		}),
		columnHelper.accessor("lastname", {
			id: "lastname",
			header: () => (
				<SortingButton
					sort={lastnameSort}
					onClick={() =>
						dispatch(usersFiltersSlice.actions.toggleSort("lastname"))
					}
				>
					Nom
				</SortingButton>
			),
		}),
		columnHelper.accessor("login", {
			id: "login",
			header: () => (
				<SortingButton
					sort={loginSort}
					onClick={() =>
						dispatch(usersFiltersSlice.actions.toggleSort("login"))
					}
				>
					Pseudo
				</SortingButton>
			),
		}),
		columnHelper.accessor("email", {
			id: "email",
			header: () => (
				<SortingButton
					sort={emailSort}
					onClick={() =>
						dispatch(usersFiltersSlice.actions.toggleSort("email"))
					}
				>
					Email
				</SortingButton>
			),
		}),
		columnHelper.accessor("role", {
			id: "role",
			header: () => (
				<SortingButton
					sort={roleSort}
					onClick={() => dispatch(usersFiltersSlice.actions.toggleSort("role"))}
				>
					Rôle
				</SortingButton>
			),
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
	const table = useReactTable({
		data: users,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});
	return (
		<div className="flex flex-col gap-4 overflow-auto">
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

			{metadata && (
				<Pagination
					currentPage={page}
					setCurrentPage={(newPage) => {
						dispatch(usersFiltersSlice.actions.setPage(newPage));
					}}
					pagesCount={metadata?.pagesCount}
				/>
			)}
		</div>
	);
};
