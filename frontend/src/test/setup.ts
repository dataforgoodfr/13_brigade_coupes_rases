import { vi } from "vitest";
import "../index.css";
vi.mock("@/features/clear-cutting/components/map/InteractiveMap", () => ({
	InteractiveMap: vi.fn(),
}));

window.scrollTo = vi.fn();
