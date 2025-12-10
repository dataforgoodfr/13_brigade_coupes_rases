import { createContext, useContext, useState } from "react"

import { useBreakpoint } from "@/shared/hooks/breakpoint"

type Layout = "map" | "list"

export type LayoutContext = {
	layout: Layout
	setLayout: (layout: Layout) => void
}

const LayoutCtx = createContext<LayoutContext>({
	layout: "map",
	setLayout: () => undefined
})

export const useLayout = () => {
	return useContext<LayoutContext>(LayoutCtx)
}

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
	const { breakpoint } = useBreakpoint()
	const [layout, setLayout] = useState<Layout>(
		breakpoint === "mobile" ? "map" : "list"
	)

	return (
		<LayoutCtx.Provider value={{ layout, setLayout }}>
			{children}
		</LayoutCtx.Provider>
	)
}
