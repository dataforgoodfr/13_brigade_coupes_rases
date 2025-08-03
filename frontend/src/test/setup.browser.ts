import { worker } from "@/mocks/browser";
import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import "../index.css";

configure({
	asyncUtilTimeout: 5_000,
});

beforeAll(() => worker.start());
afterEach(() => {
	worker.resetHandlers();
});
afterAll(() => worker.stop());
