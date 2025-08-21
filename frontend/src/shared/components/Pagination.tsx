import { take } from "es-toolkit";
import { useState } from "react";
import {
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	Pagination as PaginationUI,
} from "@/components/ui/pagination";

const DISPLAYED_PAGES_CHUNK = 5;

type Props = {
	currentPage: number;
	setCurrentPage: (page: number) => void;
	pagesCount: number;
	className?: string;
};

export const Pagination: React.FC<Props> = ({
	currentPage,
	setCurrentPage,
	pagesCount,
	className,
}) => {
	const [nbOfDisplayedPages, setNbOfDisplayedPages] = useState(
		DISPLAYED_PAGES_CHUNK,
	);

	return (
		<PaginationUI className={className}>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						onClick={() => {
							if (currentPage - 1 >= 0) setCurrentPage(currentPage - 1);
						}}
						aria-disabled={currentPage === 0}
						className="cursor-pointer"
					/>
				</PaginationItem>

				{take(
					Array.from({ length: nbOfDisplayedPages }),
					nbOfDisplayedPages,
				).map((_, index) => {
					if (index + 1 >= pagesCount) {
						return null;
					}

					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: This is a pagination, the index is the page number
						<PaginationItem key={index}>
							<PaginationLink
								isActive={currentPage === index + 1}
								onClick={() => setCurrentPage(index)}
								className="cursor-pointer"
							>
								{index + 1}
							</PaginationLink>
						</PaginationItem>
					);
				})}

				{pagesCount > nbOfDisplayedPages && (
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
							if (currentPage + 1 < pagesCount) setCurrentPage(currentPage + 1);

							if (currentPage + 1 > nbOfDisplayedPages) {
								setNbOfDisplayedPages(
									nbOfDisplayedPages + DISPLAYED_PAGES_CHUNK,
								);
							}
						}}
						aria-disabled={currentPage + 1 === pagesCount}
						className="cursor-pointer"
					/>
				</PaginationItem>
			</PaginationContent>
		</PaginationUI>
	);
};

export default Pagination;
