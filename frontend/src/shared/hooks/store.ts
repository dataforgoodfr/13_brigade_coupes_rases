import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/shared/store/store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
