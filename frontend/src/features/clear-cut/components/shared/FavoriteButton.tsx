import clsx from "clsx";
import { HeartIcon } from "lucide-react";
import {
	addFavoriteThunk,
	removeFavoriteThunk,
	selectFavorites,
} from "@/features/user/store/me.slice";
import { IconButton } from "@/shared/components/button/Button";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";

type Props = {
	reportId: string;
};
export const FavoriteButton = ({ reportId }: Props) => {
	const dispatch = useAppDispatch();
	const isFavorite = useAppSelector(selectFavorites).includes(reportId);
	return (
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
	);
};
