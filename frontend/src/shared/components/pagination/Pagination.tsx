import {
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	Pagination as PaginationUI,
} from "@/components/ui/pagination";
import { take } from "lodash-es";
import { useState } from "react";

const DISPLAYED_PAGES_CHUNK = 5;

type PaginationProps = {
	currentPage: number;
	setCurrentPage: (page: number) => void;
	totalPages: number;
};

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	setCurrentPage,
	totalPages,
}) => {
	const [nbOfDisplayedPages, setNbOfDisplayedPages] = useState(
		DISPLAYED_PAGES_CHUNK,
	);

	return (
		<PaginationUI>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						onClick={() => {
							if (currentPage - 1 > 0) setCurrentPage(currentPage - 1);
						}}
						aria-disabled={currentPage === 1}
						className="cursor-pointer"
					/>
				</PaginationItem>

				{take(
					Array.from({ length: nbOfDisplayedPages }),
					nbOfDisplayedPages,
				).map((_, index) => {
					if (index + 1 >= totalPages) {
						return null;
					}

					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: This is a pagination, the index is the page number
						<PaginationItem key={index}>
							<PaginationLink
								isActive={currentPage === index + 1}
								onClick={() => setCurrentPage(index + 1)}
								className="cursor-pointer"
							>
								{index + 1}
							</PaginationLink>
						</PaginationItem>
					);
				})}

				{totalPages > nbOfDisplayedPages && (
					<PaginationItem>
						<PaginationEllipsis
							onClick={() => {
								setNbOfDisplayedPages(
									nbOfDisplayedPages + DISPLAYED_PAGES_CHUNK,
								);
							}}
							className="cursor-pointer"
						/>
					</PaginationItem>
				)}

				<PaginationItem>
					<PaginationNext
						onClick={() => {
							if (currentPage + 1 < totalPages) setCurrentPage(currentPage + 1);

							if (currentPage + 1 > nbOfDisplayedPages) {
								setNbOfDisplayedPages(
									nbOfDisplayedPages + DISPLAYED_PAGES_CHUNK,
								);
							}
						}}
						aria-disabled={currentPage + 1 === totalPages}
						className="cursor-pointer"
					/>
				</PaginationItem>
			</PaginationContent>
		</PaginationUI>
	);
};

export default Pagination;
