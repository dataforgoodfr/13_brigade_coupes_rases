import { server } from "@/test/mocks/server";
import { cleanup, configure } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import "../index.css";
vi.mock("@/features/clear-cut/components/map/InteractiveMap", () => ({
	InteractiveMap: vi.fn(),
}));

configure({
	asyncUtilTimeout: 5_000,
});
window.scrollTo = vi.fn();

global.ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
};
vi.stubGlobal("navigator", {
	geolocation: vi.fn(),
});

beforeAll(() => server.listen());
afterEach(() => {
	server.resetHandlers();
	cleanup();
});
afterAll(() => server.close());
