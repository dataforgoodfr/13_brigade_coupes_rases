import { createContext, useContext, useState } from "react";

type Layout = "map" | "list";
export type LayoutContext = {
	layout: Layout;
	setLayout: (layout: Layout) => void;
};
const LayoutCtx = createContext<LayoutContext>(
	{layout: 'list', setLayout: () => undefined}
);

export const useLayout = () => {
	return useContext<LayoutContext>(LayoutCtx);
};

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
	const [layout, setLayout] = useState<Layout>("list");

	return (
		<LayoutCtx.Provider value={{ layout, setLayout }}>
			{children}
		</LayoutCtx.Provider>
	);
};
