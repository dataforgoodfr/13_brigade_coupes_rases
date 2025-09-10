import type { PaginationResponse } from "@/shared/api/types";

export function createPaginationOneElementMock<T>(
	content: T,
): PaginationResponse<T> {
	return {
		content: [content],
		metadata: {
			links: {},
			page: 0,
			size: 1,
			pagesCount: 1,
			totalCount: 1,
		},
	};
}
