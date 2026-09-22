import { worker } from "@/mocks/browser"
import "@testing-library/jest-dom/vitest"
import { configure } from "@testing-library/react"
import { afterAll, afterEach, beforeAll, vi } from "vitest"
import "react/jsx-dev-runtime"
import "react-dom/client"

import "../index.css"

import.meta.glob("../../dist/assets/*.css", { eager: true })

vi.mock("@/features/offline/hooks/useReloadPwa", () => ({
	useReloadPwa: vi.fn()
}))

configure({
	asyncUtilTimeout: 5_000
})
// quiet : MSW ne journalise plus chaque requête interceptée (requête, handler,
// réponse), que Vitest recopie dans le terminal par milliers de lignes.
beforeAll(() => worker.start({ quiet: true }))
afterEach(() => {
	localStorage.clear()
	worker.resetHandlers()
})
afterAll(() => worker.stop())
