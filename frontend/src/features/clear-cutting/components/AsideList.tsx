import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AdvancedFilters } from "@/features/clear-cutting/components/filters/AdvancedFilters";
import { useGetClearCuttingsQuery } from "@/features/clear-cutting/store/api";
import type { ClearCuttingPreview } from "@/features/clear-cutting/store/clear-cuttings";
import { useNavigate } from "@tanstack/react-router";
import { Camera } from "lucide-react";
export function AsideList() {
	const { data } = useGetClearCuttingsQuery();
	const navigate = useNavigate();

	const handleCardClick = (clearCutting: ClearCuttingPreview) => {
		navigate({
			to: "/map/$clearCuttingId",
			params: { clearCuttingId: clearCutting.id },
		});
	};

	return (
		<div className="flex flex-col  h-full  ">
			<h1 className="text-2xl 2xl:text-4xl/6  text-secondary text-start font-semibold font-poppins mt-14">
				COUPES RASES
			</h1>
			<AdvancedFilters className="mt-6 px-5" />
			<div className=" px-5 overflow-auto">
				<ul className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6 ">
					{data?.clearCuttingPreviews.map((clearCutting) => (
						<li
							key={clearCutting.id}
							className="col-span-1 flex flex-col divide-y divide-gray-200  rounded-lg bg-white text-center shadow"
						>
							<Card
								onClick={() => handleCardClick(clearCutting)}
								className="cursor-pointer"
							>
								<CardContent className="pt-6">
									{clearCutting.imageUrl && (
										<div
											style={{
												backgroundImage: `url(${clearCutting.imageUrl})`,
											}}
											className=" mx-auto w-full flex flex-row-reverse h-42 bg-cover bg-center bg-no-repeat"
										>
											{clearCutting.imagesCnt !== undefined &&
												clearCutting.imagesCnt > 0 && (
													<Badge variant="accent" className="gap-1 mt-auto">
														{clearCutting.imagesCnt}
														<Camera fontSize="small" />
													</Badge>
												)}
										</div>
									)}
								</CardContent>
								<CardFooter className="flex flex-col">
									<h3 className="me-auto text-lg font-bold text-gray-800">
										{clearCutting.name}
									</h3>
									<div className="me-auto text-md font-medium text-gray-600">
										{clearCutting.address.postalCode}{" "}
										{clearCutting.address.city}
									</div>
								</CardFooter>
							</Card>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
