import { server } from "@/test/mocks/server";
import { configure } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import "../index.css";
vi.mock("@/features/clear-cutting/components/map/InteractiveMap", () => ({
	InteractiveMap: vi.fn(),
}));

configure({
	asyncUtilTimeout: 20_000,
});
window.scrollTo = vi.fn();

global.ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
};

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
