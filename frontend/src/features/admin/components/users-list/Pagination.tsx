import { selectMetadata } from "@/features/admin/store/users.slice";
import { usersFiltersSlice } from "@/features/admin/store/users-filters.slice";
import { Pagination as SharedPagination } from "@/shared/components/Pagination";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import type { ClassNameProps } from "@/shared/types/props";

export function Pagination({ className }: ClassNameProps) {
	const metadata = useAppSelector(selectMetadata);
	const dispatch = useAppDispatch();
	return (
		metadata && (
			<SharedPagination
				className={className}
				currentPage={metadata.page}
				setCurrentPage={(newPage) => {
					dispatch(usersFiltersSlice.actions.setPage(newPage));
				}}
				pagesCount={metadata?.pagesCount}
			/>
		)
	);
}
