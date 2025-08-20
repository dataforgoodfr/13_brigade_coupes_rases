import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { upperFirst } from "es-toolkit";
import { useMemo } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { User } from "@/features/admin/store/users";
import { selectUsers } from "@/features/admin/store/users.slice";
import {
	selectColumnSort,
	selectDepartments,
	selectFilter,
	selectRoles,
	usersFiltersSlice,
} from "@/features/admin/store/users-filters.slice";
import { Badge } from "@/shared/components/Badge";
import { SortingButton } from "@/shared/components/button/SortingButton";
import { Input } from "@/shared/components/input/Input";
import { ComboboxFilter } from "@/shared/components/select/ComboboxFilter";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import {
	namedIdTranslator,
	selectableItemToString,
	useEnhancedItems,
} from "@/shared/items";

const columnHelper = createColumnHelper<User>();
type Props = {
	label: string;
	field: "firstName" | "lastName" | "login" | "email";
};
const TextHeader = ({ label, field }: Props) => {
	const dispatch = useAppDispatch();
	const firstName = useAppSelector(selectFilter<typeof field>(field));
	const firstNameSort = useAppSelector((s) => selectColumnSort(s, field));
	const action: `set${Capitalize<typeof field>}` = `set${upperFirst(field) as Capitalize<typeof field>}`;
	return (
		<div className="flex grow items-center gap-1">
			<label htmlFor={field}>{label}</label>
			<Input
				id={field}
				value={firstName}
				onChange={(e) => {
					dispatch(usersFiltersSlice.actions[action](e.target.value));
				}}
			/>
			<SortingButton
				sort={firstNameSort}
				onClick={() => dispatch(usersFiltersSlice.actions.toggleSort(field))}
			></SortingButton>
		</div>
	);
};

const RoleHeader = () => {
	const dispatch = useAppDispatch();
	const roleSort = useAppSelector((s) => selectColumnSort(s, "role"));
	const roles = useEnhancedItems({
		items: useAppSelector(selectRoles),
		getItemLabel: selectableItemToString,
		getItemValue: selectableItemToString,
	});
	return (
		<>
			<ComboboxFilter
				type="multiple"
				countPreview
				hasInput
				hasReset
				label="Rôle"
				items={roles}
				changeOnClose={(roles) =>
					dispatch(usersFiltersSlice.actions.setRoles(roles))
				}
			/>
			<SortingButton
				sort={roleSort}
				onClick={() => dispatch(usersFiltersSlice.actions.toggleSort("role"))}
			/>
		</>
	);
};

export const UsersList: React.FC = () => {
	const users = useAppSelector(selectUsers);
	const dispatch = useAppDispatch();

	const departments = useEnhancedItems({
		items: useAppSelector(selectDepartments),
		getItemLabel: namedIdTranslator,
		getItemValue: namedIdTranslator,
	});
	const columns = [
		columnHelper.accessor("firstName", {
			id: "firstName",
			header: () => <TextHeader field="firstName" label="Prénom" />,
		}),
		columnHelper.accessor("lastName", {
			id: "lastName",
			header: () => <TextHeader field="lastName" label="Nom" />,
		}),
		columnHelper.accessor("login", {
			id: "login",
			header: () => <TextHeader field="login" label="Pseudo" />,
		}),
		columnHelper.accessor("email", {
			id: "email",
			header: () => <TextHeader field="email" label="Email" />,
		}),
		columnHelper.accessor("role", {
			id: "role",
			header: RoleHeader,
		}),
		columnHelper.accessor("departments", {
			id: "departments",
			header: () => (
				<ComboboxFilter
					type="multiple"
					countPreview
					hasInput
					hasReset
					label="Départements"
					items={departments}
					changeOnClose={(departments) =>
						dispatch(usersFiltersSlice.actions.setDepartments(departments))
					}
				/>
			),
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
	const headerGroups = useMemo(() => table.getHeaderGroups(), [table]);
	return (
		<Table className="table-fixed ">
			<TableHeader>
				{headerGroups.map((headerGroup) => (
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
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								);
							})}
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};
