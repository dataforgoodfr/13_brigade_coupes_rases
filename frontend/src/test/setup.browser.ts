import { worker } from "@/mocks/browser";
import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import "react/jsx-dev-runtime";
import "react-dom/client";

import "../index.css";

import.meta.glob("../../dist/assets/*.css", { eager: true });

vi.mock("@/features/offline/hooks/useReloadPwa", () => ({
	useReloadPwa: vi.fn(),
}));

configure({
	asyncUtilTimeout: 5_000,
});
beforeAll(() => worker.start());
afterEach(() => {
	window.localStorage.clear();
	worker.resetHandlers();
});
afterAll(() => worker.stop());
