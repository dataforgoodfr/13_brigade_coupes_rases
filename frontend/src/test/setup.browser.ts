import { worker } from "@/mocks/browser";
import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import "../index.css";
// import { cleanup } from "vitest-browser-react";

// import.meta.glob("../../dist/assets/*.css", { eager: true });

vi.mock("@/features/offline/hooks/useReloadPwa", () => ({
	useReloadPwa: vi.fn(),
}));

configure({
	asyncUtilTimeout: 5_000,
});

// beforeEach(() => cleanup());
beforeAll(() => worker.start());
afterEach(() => {
	worker.resetHandlers();
});
afterAll(() => worker.stop());
