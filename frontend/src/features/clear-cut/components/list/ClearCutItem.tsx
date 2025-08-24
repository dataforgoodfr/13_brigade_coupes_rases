import clsx from "clsx";
import { HeartIcon } from "lucide-react";
import { FormattedDate } from "react-intl";
import { useMapInstance } from "@/features/clear-cut/components/map/Map.context";
import { RuleBadge } from "@/features/clear-cut/components/RuleBadge";
import { StatusWithLabel } from "@/features/clear-cut/components/StatusWithLabel";
import { useNavigateToClearCut } from "@/features/clear-cut/hooks";
import type { ClearCutReport } from "@/features/clear-cut/store/clear-cuts";
import {
	addFavoriteThunk,
	removeFavoriteThunk,
	useMe,
} from "@/features/user/store/me.slice";
import { IconButton } from "@/shared/components/button/Button";
import { useAppDispatch } from "@/shared/hooks/store";

type FavoriteButtonProps = {
	reportId: string;
};
const FavoriteButton = ({ reportId }: FavoriteButtonProps) => {
	const me = useMe();
	const dispatch = useAppDispatch();
	const isFavorite = me?.favorites.includes(reportId);
	return (
		<>
			{me && (
				<IconButton
					variant="ghost"
					icon={
						<HeartIcon
							className={clsx("text-destructive", {
								"fill-destructive": isFavorite,
							})}
						/>
					}
					onClick={(e) => {
						e.stopPropagation();
						if (isFavorite) {
							dispatch(removeFavoriteThunk(reportId));
						} else {
							dispatch(addFavoriteThunk(reportId));
						}
					}}
				/>
			)}
		</>
	);
};
export function ClearCutItem({
	id,
	createdAt,
	status,
	comment,
	rules: tags,
	city,
}: ClearCutReport) {
	const handleCardClick = useNavigateToClearCut(id);
	const { focusedClearCutId, setFocusedClearCutId } = useMapInstance();

	return (
		<li
			onClick={handleCardClick}
			onMouseEnter={() => setFocusedClearCutId(id)}
			onMouseLeave={() => setFocusedClearCutId(undefined)}
			onKeyUp={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleCardClick();
				}
			}}
			className={clsx("p-3 flex flex-col cursor-pointer gap-2", {
				"bg-zinc-200/50 rounded-2xl": focusedClearCutId === id,
			})}
		>
			<div className="flex justify-between">
				<h3 className="me-auto text-lg font-bold text-gray-800">{city}</h3>
				<FormattedDate value={createdAt} />
			</div>
			<div className="flex justify-between items-center">
				<StatusWithLabel status={status} />
				<FavoriteButton reportId={id} />
			</div>
			{comment && <p className="text-zinc-500 line-clamp-2">{comment}</p>}
			<div className="flex gap-2 ">
				{tags.map((tag) => (
					<RuleBadge key={tag.id} {...tag} />
				))}
			</div>
		</li>
	);
}
