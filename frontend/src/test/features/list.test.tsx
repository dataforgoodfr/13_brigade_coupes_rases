import {
	createClearCuttingPreviewResponse,
	mockClearCuttingsResponse,
} from "@/mocks/clear-cuttings";
import { server } from "@/test/mocks/server";
import { clearCuttings } from "@/test/page-object/clear-cuttings";
import { renderApp } from "@/test/renderApp";
import { describe, expect, it } from "vitest";
describe("Clear cuttings list", () => {
	it("should render preview", async () => {
		const preview = createClearCuttingPreviewResponse({
			name: "TEST NAME",
			comment: "TEST COMMENT",
		});
		server.use(
			mockClearCuttingsResponse({
				clearCuttingPreviews: [preview],
			}),
		);
		// TODO : need to mock InteractiveMap in antoher way in order to keep the Outlet in it working
		const { user } = renderApp({
			route: "/clear-cuttings",
		});

		const item = (await clearCuttings({ user })).list.item(
			preview.name as string,
		);
		expect(item.comment).toBe(preview.comment);
	});
});
