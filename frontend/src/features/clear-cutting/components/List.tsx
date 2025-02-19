import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DisplayTypeMenu } from "@/features/clear-cutting/components/shared/DisplayTypeMenu";
import { Filters } from "@/features/clear-cutting/components/shared/Filters";
import { useGetClearCuttingsQuery } from "@/features/clear-cutting/store/api";
import Camera from "@mui/icons-material/CameraAltOutlined";
export function AsideList() {
	const { data } = useGetClearCuttingsQuery();

	return (
		<>
			<DisplayTypeMenu />
			<Filters />
			<ul className="grid grid-cols-1 gap-6 lg:grid-cols-2 overflow-auto ">
				{data?.clearCuttingPreviews.map((clearCutting) => (
					<li
						key={clearCutting.id}
						className="col-span-1 flex flex-col divide-y divide-gray-200  rounded-lg bg-white text-center shadow"
					>
						<Card>
							<CardContent className="pt-6">
								{clearCutting.imageUrl && (
									<div
										style={{ backgroundImage: `url(${clearCutting.imageUrl})` }}
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
									{clearCutting.address.postalCode} {clearCutting.address.city}
								</div>
							</CardFooter>
						</Card>
					</li>
				))}
			</ul>
		</>
	);
}
